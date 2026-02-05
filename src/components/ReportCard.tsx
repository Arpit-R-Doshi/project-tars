'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { generateZKProof } from '../utils/zkp';
import { 
  Shield, ExternalLink, Clock, Download, Lock, 
  Loader2, CheckCircle2, Users, MapPin, AlertCircle, 
  Calendar, BrainCircuit, XCircle 
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MapPicker = dynamic(() => import('./MapPicker'), { 
    ssr: false,
    loading: () => <div className="h-44 w-full bg-black animate-pulse rounded-xl border border-gray-800" />
});

export default function ReportCard({ id, zkSecret }: { id: number, zkSecret: string }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{isAiGenerated: boolean, confidenceScore: number, reasoning: string} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)] 
  });

  const reporterAddress = report ? report[2] : null;
  const { data: reporterScore } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getTrustScore', args: [reporterAddress]
  });

  const { writeContractAsync } = useWriteContract();

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
    } catch(e) { console.error("Authorization or Decryption failed", e); } finally { setIsActionLoading(false); }
  };

  const handleCastVote = async () => {
    setIsActionLoading(true);
    try {
        const { proof, leaf } = generateZKProof(zkSecret);
        await writeContractAsync({
            address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
            functionName: 'castValidationVote',
            args: [BigInt(id), proof as `0x${string}`[], leaf as `0x${string}`, zkSecret],
        });
    } catch (e: any) { console.error("Voting failed", e); } finally { setIsActionLoading(false); }
  };
  
  // DUMMY FLAG/REJECTION VOTE FUNCTION (UI BUTTON)
  const handleFlagCase = () => {
      alert("Flagging (Rejection) logic is reserved for the Protocol Owner's emergency override. This button confirms the intent to reject the case.");
  };

  const runAiAudit = async () => {
    if (!decryptedImage) return;
    setIsAiLoading(true);
    try {
        const res = await axios.post('/api/analyze', { imageBase64: decryptedImage });
        setAiResult(res.data);
    } catch (e) { console.error("AI Forensic engine error", e); } finally { setIsAiLoading(false); }
  };
  
  const downloadOfficialReport = () => {
    if (!dossier) return;
    const doc = new jsPDF();
    doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("courier", "bold"); doc.setFontSize(22); doc.text("TARS CLASSIFIED EVIDENCE", 15, 25);
    doc.setFontSize(9); doc.text("DECENTRALIZED WHISTLEBLOWING NETWORK // FORENSIC DOSSIER", 15, 35);
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);
    doc.text(`CASE ID: #${id}`, 15, 60); doc.text(`CATEGORY: ${dossier.crimeType}`, 15, 67);
    doc.text(`INCIDENT DATE: ${dossier.incidentDate} // ${dossier.incidentTime}`, 15, 74);
    doc.text("STATEMENT:", 15, 90);
    const splitText = doc.splitTextToSize(dossier.description, 180); doc.text(splitText, 15, 97);
    if (decryptedImage) {
        doc.addPage();
        doc.text("FORENSIC MEDIA ATTACHMENT", 15, 15);
        doc.addImage(decryptedImage, 'JPEG', 15, 30, 180, 120);
    }
    doc.save(`TARS-DOSSIER-CASE-${id}.pdf`);
  };

  if (!report) return null;

  const approvalCount = Number(report[6]);
  const isFullyVerified = report[4];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl transition-all hover:border-blue-900/30">
      
      {/* Header Panel */}
      <div className="bg-black/60 p-6 flex flex-wrap justify-between items-center border-b border-gray-800 gap-4">
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-black">Ref_ID: #{id}</span>
            <a href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" className="text-[9px] text-blue-500 flex items-center gap-1.5 hover:text-blue-400 font-bold bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                <ExternalLink size={10} /> Explorer Link
            </a>
        </div>

        <div className="flex items-center gap-3 bg-gray-950 px-4 py-2 rounded-full border border-gray-800">
            <Users size={14} className={isFullyVerified ? "text-green-500" : "text-blue-500"} />
            <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${isFullyVerified ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(approvalCount / 3) * 100}%` }} />
            </div>
            <span className="text-[9px] font-black font-mono">{approvalCount}/3 VOTES</span>
        </div>
      </div>

      {!dossier ? (
        <div className="p-24 text-center space-y-5 bg-[radial-gradient(circle_at_center,_rgba(29,78,216,0.05)_0%,_transparent_70%)]">
            <button 
                onClick={handleDecryptAndLog} 
                disabled={isActionLoading} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2xl font-black text-xs tracking-widest flex items-center gap-4 mx-auto transition-all shadow-2xl shadow-blue-900/30 active:scale-95 disabled:opacity-50"
            >
                {isActionLoading ? <Loader2 className="animate-spin" size={16}/> : <Lock size={16}/>} 
                DECRYPT EVIDENCE DOSSIER
            </button>
            <p className="text-[9px] text-gray-600 uppercase font-mono tracking-widest italic">Authorization Required // Access Logged on Polygon</p>
        </div>
      ) : (
        <div className="p-8 grid lg:grid-cols-2 gap-12">
          
          {/* Intelligence Column */}
          <div className="space-y-6">
             <div className="flex flex-wrap gap-2">
                <span className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-900/50 text-[10px] font-black uppercase flex items-center gap-2">
                    <AlertCircle size={12} /> {dossier.crimeType}
                </span>
                <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase ${dossier.urgency === 'CRITICAL' ? 'bg-red-900/20 text-red-500 border-red-900/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {dossier.urgency} URGENCY
                </span>
             </div>

             <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-gray-500 uppercase">
                <div className="flex items-center gap-2"><Calendar size={12}/> {dossier.incidentDate}</div>
                <div className="flex items-center gap-2"><Clock size={12}/> {dossier.incidentTime}</div>
             </div>

             <p className="text-sm text-gray-300 leading-relaxed bg-black/40 p-6 rounded-2xl border border-gray-800 italic shadow-inner">
                "{dossier.description}"
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
                className="w-full py-3 rounded-xl border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-xs font-black uppercase flex items-center justify-center gap-2"
             >
                <Download size={16} /> Generate Classified Report (PDF)
             </button>
          </div>

          {/* Forensics Column */}
          <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Visual Forensics</label>
                {decryptedImage && (
                    <img 
                        src={decryptedImage} 
                        className="rounded-3xl border border-gray-800 w-full shadow-2xl transition-all hover:scale-[1.01]" 
                        alt="Evidence"
                    />
                )}
            </div>
            
            {/* <button 
                onClick={runAiAudit}
                disabled={isAiLoading || !decryptedImage}
                className="bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border border-purple-800/50 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-30"
            >
                {isAiLoading ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                RUN AI FORENSICS
            </button> */}

            {/* Action Buttons: Validation Vote and Rejection Vote */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                    onClick={handleCastVote} 
                    disabled={isActionLoading || isFullyVerified}
                    className={`rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                        isFullyVerified 
                        ? 'bg-green-900/10 text-green-500 border border-green-900/30 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/30 active:scale-95'
                    }`}
                >
                    {isActionLoading ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>}
                    VALIDATION VOTE
                </button>
                <button 
                    onClick={handleFlagCase} // The newly added dummy function
                    disabled={isActionLoading || isFullyVerified}
                    className="bg-red-600 hover:bg-red-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                    <XCircle size={14}/> REJECTION VOTE
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}