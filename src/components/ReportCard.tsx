'use client';
import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { motion } from 'framer-motion';
import { MapPin, Shield, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ReportCard({ id }: { id: number }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);

  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)] 
  });

  const reporterAddress = report ? report[2] : null;

  // Fetch the Reporter's Trust Score for Admin review
  const { data: reporterScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTrustScore',
    args: reporterAddress ? [reporterAddress] : undefined,
  });

  const { writeContract } = useWriteContract();

  const handleDecrypt = async () => {
    const KEY = "tars-hackathon-secret-key";
    try {
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${report[1]}`);
        const data = JSON.parse(decryptData(await res.text(), KEY));
        setDossier(data);
        const imgRes = await fetch(`https://gateway.pinata.cloud/ipfs/${data.evidenceImage}`);
        setDecryptedImage(decryptData(await imgRes.text(), KEY));
    } catch(e) { console.error(e); }
  };

  if (!report) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8 shadow-2xl">
      <div className="bg-black p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Case Log: #{id}</span>
            <span className="text-[9px] text-gray-600 truncate w-32 md:w-full">{reporterAddress}</span>
        </div>

        {/* Reporter Trust Score - ADMIN ONLY VIEW */}
        <div className="flex items-center gap-2 bg-gray-950 px-3 py-1 rounded-full border border-gray-800">
          <Shield className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-bold text-gray-400">REP: </span>
          <span className={`text-[10px] font-mono font-bold ${Number(reporterScore) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {reporterScore?.toString() || '50'}/100
          </span>
        </div>
      </div>

      {!dossier ? (
        <div className="p-12 text-center">
            <button onClick={handleDecrypt} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-xs tracking-widest transition-all">
                DECRYPT INTELLIGENCE
            </button>
        </div>
      ) : (
        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-gray-500 text-[10px] font-mono uppercase">
                 <Clock size={12}/> {new Date(dossier.timestamp).toLocaleString()}
             </div>
             <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-gray-800">
                 {dossier.description}
             </p>
             <div className="h-44 rounded-2xl overflow-hidden border border-gray-800 grayscale opacity-60">
                 <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={()=>{}} />
             </div>
          </div>
          <div className="space-y-6">
            {decryptedImage && <img src={decryptedImage} className="rounded-2xl border border-gray-800 w-full shadow-inner" />}
            <div className="grid grid-cols-2 gap-4">
               <button onClick={()=>writeContract({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyReport', args:[BigInt(id)]})} className="bg-green-600 hover:bg-green-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Verify</button>
               <button onClick={()=>writeContract({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'flagReport', args:[BigInt(id)]})} className="bg-red-900 hover:bg-red-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}