'use client';
import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { generateZKProof } from '../utils/zkp';
import { Shield, Clock, Lock, Loader2, CheckCircle2, Users } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ReportCard({ id, zkSecret }: { id: number, zkSecret: string }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)] 
  });

  const { writeContractAsync } = useWriteContract();

  const handleDecryptAndLog = async () => {
    setIsActionLoading(true);
    try {
        await writeContractAsync({
            address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
            functionName: 'recordAccess', args: [BigInt(id), zkSecret, "DECRYPT_VIEW"],
        });
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${report[1]}`);
        const data = JSON.parse(decryptData(await res.text(), "tars-hackathon-secret-key"));
        setDossier(data);
        const imgRes = await fetch(`https://gateway.pinata.cloud/ipfs/${data.evidenceImage}`);
        setDecryptedImage(decryptData(await imgRes.text(), "tars-hackathon-secret-key"));
    } catch(e) { console.error(e); } finally { setIsActionLoading(false); }
  };

  const handleCastVote = async () => {
    setIsActionLoading(true);
    try {
        const { proof, leaf } = generateZKProof(zkSecret);
        await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'castValidationVote',
            args: [BigInt(id), proof, leaf, zkSecret],
        });
        alert("Vote Recorded on Polygon Amoy. Consensus updated.");
    } catch (e: any) {
        alert(e.message.includes("already voted") ? "Protocol Error: This secret key has already voted." : "Transaction Failed.");
    } finally { setIsActionLoading(false); }
  };

  if (!report) return null;

  const approvalCount = Number(report[6]);
  const isFullyVerified = report[4];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8 shadow-2xl">
      <div className="bg-black p-4 flex justify-between items-center border-b border-gray-800">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Case Log: #{id}</span>
        
        {/* CONSENSUS METER */}
        <div className="flex items-center gap-3 bg-gray-950 px-4 py-1.5 rounded-full border border-gray-800">
            <Users size={12} className={isFullyVerified ? "text-green-500" : "text-blue-500"} />
            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${isFullyVerified ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${(approvalCount / 3) * 100}%` }}
                />
            </div>
            <span className="text-[10px] font-black font-mono">
                {isFullyVerified ? "CONSENSUS MET" : `${approvalCount}/3 VOTES`}
            </span>
        </div>
      </div>

      {!dossier ? (
        <div className="p-12 text-center">
            <button onClick={handleDecryptAndLog} disabled={isActionLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 mx-auto transition-all disabled:opacity-50">
                {isActionLoading ? <Loader2 className="animate-spin" size={14}/> : <Lock size={14}/>} DECRYPT EVIDENCE
            </button>
        </div>
      ) : (
        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-gray-800 italic">"{dossier.description}"</p>
             <div className="h-40 rounded-2xl overflow-hidden grayscale brightness-50 contrast-125"><MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={()=>{}} /></div>
          </div>
          <div className="space-y-6">
            {decryptedImage && <img src={decryptedImage} className="rounded-2xl border border-gray-800 w-full shadow-inner" />}
            
            <button 
                onClick={handleCastVote} 
                disabled={isActionLoading || isFullyVerified}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isFullyVerified ? 'bg-green-900/20 text-green-500 border border-green-900/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
                {isActionLoading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                {isFullyVerified ? "UNANIMOUS VERIFICATION ACHIEVED" : "VOTE TO VALIDATE (ZK-SIGN)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}