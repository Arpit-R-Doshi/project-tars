'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { generateZKProof } from '../utils/zkp';
import { 
  Shield, ExternalLink, Clock, Download, Lock, 
  Loader2, CheckCircle2, Users, MapPin, AlertCircle, Calendar 
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { jsPDF } from 'jspdf';

const MapPicker = dynamic(() => import('./MapPicker'), { 
    ssr: false,
    loading: () => <div className="h-44 w-full bg-black animate-pulse rounded-xl" />
});

export default function ReportCard({ id, zkSecret }: { id: number, zkSecret: string }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 1. Fetch Report Data
  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)] 
  });

  const { writeContractAsync } = useWriteContract();

  // 2. Logging & Decryption
  const handleDecryptAndLog = async () => {
    setIsActionLoading(true);
    const KEY = "tars-hackathon-secret-key";
    try {
        await writeContractAsync({
            address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
            functionName: 'recordAccess', args: [BigInt(id), zkSecret, "DECRYPT_VIEW"],
        });
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${report[1]}`);
        const data = JSON.parse(decryptData(await res.text(), KEY));
        setDossier(data);
        const imgRes = await fetch(`https://gateway.pinata.cloud/ipfs/${data.evidenceImage}`);
        setDecryptedImage(decryptData(await imgRes.text(), KEY));
    } catch(e) { console.error(e); } finally { setIsActionLoading(false); }
  };

  // 3. Multi-Sig Voting
  const handleCastVote = async () => {
    setIsActionLoading(true);
    try {
        const { proof, leaf } = generateZKProof(zkSecret);
        await writeContractAsync({
            address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
            functionName: 'castValidationVote',
            args: [BigInt(id), proof as `0x${string}`[], leaf as `0x${string}`, zkSecret],
        });
    } catch (e: any) { console.error(e); } finally { setIsActionLoading(false); }
  };

  // 4. Official PDF Generator
  const downloadOfficialReport = () => {
    if (!dossier) return;
    const doc = new jsPDF();
    const explorerLink = `https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`;

    // --- Header / Style ---
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(22);
    doc.text("TARS CLASSIFIED DOSSIER", 15, 25);
    
    doc.setFontSize(8);
    doc.text("DECENTRALIZED WHISTLEBLOWING NETWORK // AMOY-POLYGON-V2", 15, 32);

    // --- Body Metadata ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("PROTOCOL REFERENCE:", 15, 55);
    doc.setFont("courier", "normal");
    doc.text(`CASE ID: #${id}`, 70, 55);
    doc.text(`IPFS CID: ${report[1].substring(0, 25)}...`, 70, 60);
    
    doc.setFont("courier", "bold");
    doc.text("INTELLIGENCE DATA:", 15, 75);
    doc.setFont("courier", "normal");
    doc.text(`CATEGORY: ${dossier.crimeType}`, 70, 75);
    doc.text(`URGENCY:  ${dossier.urgency}`, 70, 80);
    doc.text(`DATE:     ${dossier.incidentDate}`, 70, 85);
    doc.text(`TIME:     ${dossier.incidentTime}`, 70, 90);

    doc.setFont("courier", "bold");
    doc.text("GEOSPATIAL REF:", 15, 105);
    doc.setFont("courier", "normal");
    doc.text(`LAT/LNG:  ${dossier.location.lat.toFixed(4)}, ${dossier.location.lng.toFixed(4)}`, 70, 105);
    doc.text(`ADDRESS:  ${dossier.location.name}`, 70, 110);

    // --- Description Box ---
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 120, 195, 120);
    doc.text("OFFICER STATEMENT:", 15, 130);
    const splitText = doc.splitTextToSize(dossier.description, 130);
    doc.text(splitText, 70, 130);

    // --- Visual Evidence ---
    if (decryptedImage) {
        doc.addPage();
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`FORENSIC EVIDENCE ATTACHMENT // CASE #${id}`, 15, 12);
        
        doc.addImage(decryptedImage, 'JPEG', 15, 40, 180, 120);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text("VERIFICATION STATUS: IMMUTABLE ON-CHAIN RECORD", 15, 170);
        doc.setTextColor(0, 100, 255);
        doc.text(`VIEW ON POLYGONSCAN: ${explorerLink}`, 15, 175);
    }

    doc.save(`TARS-DOSSIER-CASE-${id}.pdf`);
  };

  if (!report) return null;

  const approvalCount = Number(report[6]);
  const isFullyVerified = report[4];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden mb-8 shadow-2xl transition-all hover:border-blue-900/30">
      
      {/* Header Panel */}
      <div className="bg-black/50 p-5 flex flex-wrap justify-between items-center border-b border-gray-800 gap-4">
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Protocol ID: #{id}</span>
            <a 
                href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`} 
                target="_blank" 
                className="flex items-center gap-1.5 text-[9px] text-blue-500 bg-blue-500/5 px-2.5 py-1 rounded-full border border-blue-500/20 hover:bg-blue-500/10 transition-all font-bold"
            >
                <ExternalLink size={10} /> EXPLORER
            </a>
        </div>

        <div className="flex items-center gap-3 bg-gray-950 px-4 py-2 rounded-2xl border border-gray-800">
            <Users size={14} className={isFullyVerified ? "text-green-500" : "text-blue-500"} />
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${isFullyVerified ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${(approvalCount / 3) * 100}%` }}
                />
            </div>
            <span className="text-[10px] font-black font-mono tracking-tighter">
                {isFullyVerified ? "FULLY VERIFIED" : `${approvalCount}/3 VOTES`}
            </span>
        </div>
      </div>

      {!dossier ? (
        <div className="p-16 text-center space-y-4">
            <button 
                onClick={handleDecryptAndLog} 
                disabled={isActionLoading} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 mx-auto transition-all disabled:opacity-50"
            >
                {isActionLoading ? <Loader2 className="animate-spin" size={16}/> : <Lock size={16}/>} 
                DECRYPT EVIDENCE DOSSIER
            </button>
            <p className="text-[9px] text-gray-600 uppercase font-mono tracking-widest italic">Authorization required // Access logged on chain</p>
        </div>
      ) : (
        <div className="p-8 grid lg:grid-cols-2 gap-12">
          
          <div className="space-y-6">
             <div className="flex flex-wrap gap-2">
                <span className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-900/50 text-[10px] font-black uppercase">
                    <AlertCircle size={10} className="inline mr-1 mb-0.5" /> {dossier.crimeType}
                </span>
                <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase ${dossier.urgency === 'CRITICAL' ? 'bg-red-900/20 text-red-500 border-red-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {dossier.urgency} URGENCY
                </span>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                    <Calendar size={14} className="text-gray-600" />
                    <span className="text-xs font-mono text-gray-400">{dossier.incidentDate}</span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                    <Clock size={14} className="text-gray-600" />
                    <span className="text-xs font-mono text-gray-400">{dossier.incidentTime}</span>
                </div>
             </div>

             <p className="text-sm text-gray-300 leading-relaxed bg-black/40 p-6 rounded-2xl border border-gray-800 shadow-inner">
                {dossier.description}
             </p>

             <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <MapPin size={12} /> {dossier.location.name}
                </div>
                <div className="h-44 rounded-2xl overflow-hidden grayscale brightness-50 contrast-125 border border-gray-800">
                    <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={()=>{}} />
                </div>
             </div>

             <button 
                onClick={downloadOfficialReport} 
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
             >
                <Download size={16} /> Generate Classified Report (PDF)
             </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Forensic Media</label>
                {decryptedImage && (
                    <img 
                        src={decryptedImage} 
                        className="rounded-3xl border border-gray-800 w-full shadow-2xl transition-all hover:scale-[1.01]" 
                        alt="Evidence"
                    />
                )}
            </div>
            
            <button 
                onClick={handleCastVote} 
                disabled={isActionLoading || isFullyVerified}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                    isFullyVerified 
                    ? 'bg-green-900/10 text-green-500 border border-green-900/30 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20 active:scale-95'
                }`}
            >
                {isActionLoading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
                {isFullyVerified ? "VERIFICATION CONSENSUS MET" : "CAST VALIDATION VOTE"}
            </button>
            <p className="text-[9px] text-gray-600 text-center uppercase tracking-widest">Digital signature will be linked to this node</p>
          </div>
        </div>
      )}
    </div>
  );
}