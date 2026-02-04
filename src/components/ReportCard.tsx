'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Shield, 
  Clock, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  Download, 
  BrainCircuit, 
  Loader2,
  FileSearch
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { jsPDF } from 'jspdf';
import axios from 'axios';

// Dynamically import Map to prevent SSR issues
const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-44 w-full bg-black animate-pulse rounded-xl" />
});

export default function ReportCard({ id }: { id: number }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. Fetch Report Data from Blockchain
  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, 
    abi: CONTRACT_ABI, 
    functionName: 'reports', 
    args: [BigInt(id)] 
  });

  const reporterAddress = report ? report[2] : null;

  // 2. Fetch Reporter Trust Score (Visible to Admin only)
  const { data: reporterScore } = useReadContract({
    address: CONTRACT_ADDRESS, 
    abi: CONTRACT_ABI, 
    functionName: 'getTrustScore', 
    args: [reporterAddress]
  });

  const { writeContract } = useWriteContract();

  // 3. Decryption Logic
  const handleDecrypt = async () => {
    setIsDecrypting(true);
    const KEY = "tars-hackathon-secret-key";
    try {
        // Fetch Dossier JSON from IPFS
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${report[1]}`);
        const encryptedText = await res.text();
        const decryptedDossier = JSON.parse(decryptData(encryptedText, KEY));
        setDossier(decryptedDossier);

        // Fetch & Decrypt Evidence Image
        const imgRes = await fetch(`https://gateway.pinata.cloud/ipfs/${decryptedDossier.evidenceImage}`);
        const encryptedImg = await imgRes.text();
        setDecryptedImage(decryptData(encryptedImg, KEY));
    } catch(e) { 
        console.error("Decryption failed", e); 
    } finally {
        setIsDecrypting(false);
    }
  };

  // 4. AI Audit Logic
  const runAiAudit = async () => {
    if (!decryptedImage) return;
    setIsAiLoading(true);
    try {
      const res = await axios.post('/api/analyze', { imageBase64: decryptedImage });
      setAiScore(res.data.authenticityScore);
    } catch (e) {
      console.error("AI Audit failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 5. PDF Export Logic
  const downloadReport = () => {
    if (!dossier) return;
    const doc = new jsPDF();
    doc.setFont("courier", "bold");
    doc.setFontSize(20);
    doc.text("TARS CLASSIFIED EVIDENCE", 10, 20);
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text(`CASE ID: ${id}`, 10, 35);
    doc.text(`CATEGORY: ${dossier.crimeType}`, 10, 42);
    doc.text(`URGENCY: ${dossier.urgency}`, 10, 49);
    doc.text(`INCIDENT DATE: ${dossier.incidentDate}`, 10, 56);
    doc.text(`INCIDENT TIME: ${dossier.incidentTime}`, 10, 63);
    doc.text(`LOCATION: ${dossier.location.name}`, 10, 70);
    
    doc.text("DESCRIPTION:", 10, 80);
    const splitDesc = doc.splitTextToSize(dossier.description, 180);
    doc.text(splitDesc, 10, 85);

    if (decryptedImage) {
        doc.addImage(decryptedImage, 'JPEG', 10, 110, 180, 120);
    }
    doc.save(`TARS-CASE-${id}.pdf`);
  };

  if (!report) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8 shadow-2xl transition-all hover:border-blue-900/40">
      
      {/* Header Section */}
      <div className="bg-black p-4 flex flex-wrap justify-between items-center border-b border-gray-800 gap-4">
        <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Case ID: #{id}</span>
              <a 
                href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`} 
                target="_blank" 
                className="text-[9px] text-blue-500 flex items-center gap-1 hover:text-blue-400 font-bold transition-colors"
              >
                <ExternalLink size={10} /> Explorer
              </a>
            </div>
            <span className="text-[9px] text-gray-600 truncate w-48 mt-1 font-mono">Reporter: {reporterAddress}</span>
        </div>

        {/* Reporter Trust Score Badge */}
        <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
          <Shield className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Reporter Trust: </span>
          <span className={`text-[10px] font-mono font-bold ${Number(reporterScore) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {reporterScore?.toString() || '50'}/100
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!dossier ? (
          <motion.div 
            key="locked"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-16 text-center"
          >
              <button 
                onClick={handleDecrypt} 
                disabled={isDecrypting}
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-[0.2em] transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50"
              >
                  {isDecrypting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> DECRYPTING...
                      </div>
                  ) : "DECRYPT EVIDENCE DOSSIER"}
              </button>
              <p className="text-[9px] text-gray-600 mt-4 uppercase font-mono tracking-widest">Awaiting AES-256 Authority Key...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="unlocked"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="p-8 grid md:grid-cols-2 gap-10"
          >
            {/* Left Panel: Intelligence Data */}
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-800/50 text-[10px] font-black uppercase tracking-widest">
                    {dossier.crimeType}
                  </span>
                  <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${dossier.urgency === 'CRITICAL' ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {dossier.urgency} Urgency
                  </span>
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-gray-500">
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-gray-800">
                    <Calendar size={12} className="text-blue-500" /> {dossier.incidentDate}
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-gray-800">
                    <Clock size={12} className="text-blue-500" /> {dossier.incidentTime}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Evidence Statement</label>
                  <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-5 rounded-2xl border border-gray-800 shadow-inner">
                    {dossier.description}
                  </p>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12}/> {dossier.location.name}
                  </label>
                  <div className="h-44 rounded-2xl overflow-hidden border border-gray-800 grayscale brightness-75 contrast-125 shadow-inner">
                    <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={()=>{}} />
                  </div>
               </div>
            </div>

            {/* Right Panel: Media & Forensics */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Visual Intelligence</label>
                {decryptedImage && (
                    <img 
                        src={decryptedImage} 
                        className="rounded-2xl border border-gray-800 w-full shadow-2xl transition-all hover:scale-[1.02]" 
                        alt="Evidence"
                    />
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={runAiAudit}
                  disabled={isAiLoading}
                  className="bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border border-purple-800/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                  {aiScore ? `AI: ${aiScore}% CONFIDENCE` : "RUN AI AUDIT"}
                </button>
                <button 
                  onClick={downloadReport}
                  className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={14} /> EXPORT PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={()=>writeContract({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyReport', args:[BigInt(id)]})} 
                  className="bg-green-600 hover:bg-green-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 transition-all active:scale-95"
                >
                  Verify Report
                </button>
                <button 
                  onClick={()=>writeContract({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'flagReport', args:[BigInt(id)]})} 
                  className="bg-red-900 hover:bg-red-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 transition-all active:scale-95"
                >
                  Flag Malicious
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}