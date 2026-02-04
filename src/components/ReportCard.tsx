'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Shield, Clock, ExternalLink, Calendar, AlertCircle, Download, Lock, Loader2 
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
  const [isLogging, setIsLogging] = useState(false);

  const { data: report }: any = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)] 
  });

  const reporterAddress = report ? report[2] : null;
  const { data: reporterScore } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getTrustScore', args: [reporterAddress]
  });

  const { writeContractAsync } = useWriteContract();

  const handleDecryptAndLog = async () => {
    setIsLogging(true);
    const KEY = "tars-hackathon-secret-key";
    try {
        // 1. MUST LOG ACCESS ON-CHAIN FIRST
        await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'recordAccess',
            args: [BigInt(id), zkSecret], // Logs Case ID and the Secret used
        });

        // 2. Fetch and Decrypt
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${report[1]}`);
        const data = JSON.parse(decryptData(await res.text(), KEY));
        setDossier(data);
        const imgRes = await fetch(`https://gateway.pinata.cloud/ipfs/${data.evidenceImage}`);
        setDecryptedImage(decryptData(await imgRes.text(), KEY));
    } catch(e) { 
        console.error(e); 
    } finally { 
        setIsLogging(false); 
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFont("courier", "bold");
    doc.text("TARS CLASSIFIED REPORT", 10, 20);
    doc.setFontSize(10);
    doc.text(`CASE ID: ${id}`, 10, 35);
    doc.text(`LOCATION: ${dossier.location.name}`, 10, 45);
    doc.text(`STATEMENT: ${dossier.description}`, 10, 55);
    if (decryptedImage) doc.addImage(decryptedImage, 'JPEG', 10, 70, 180, 120);
    doc.save(`TARS-CASE-${id}.pdf`);
  };

  if (!report) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8 shadow-2xl">
      <div className="bg-black p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Case: #{id}</span>
          <a href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`} target="_blank" className="text-[9px] text-blue-500 flex items-center gap-1 hover:underline">
            <ExternalLink size={10} /> EXPLORER
          </a>
        </div>
        <div className="flex items-center gap-2 bg-gray-950 px-3 py-1 rounded-full border border-gray-800">
          <Shield className="w-3 h-3 text-blue-500" />
          <span className={`text-[10px] font-mono font-bold ${Number(reporterScore) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            REP: {reporterScore?.toString() || '50'}/100
          </span>
        </div>
      </div>

      {!dossier ? (
        <div className="p-12 text-center">
            <button 
                onClick={handleDecryptAndLog} 
                disabled={isLogging}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 mx-auto"
            >
                {isLogging ? <Loader2 className="animate-spin" size={14}/> : <Lock size={14}/>} 
                {isLogging ? "LOGGING ACCESS..." : "DECRYPT & LOG ACCESS"}
            </button>
            <p className="text-[9px] text-gray-600 mt-4 uppercase font-mono tracking-widest">Action will be logged on the public ledger.</p>
        </div>
      ) : (
        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase">
                <AlertCircle size={14} /> {dossier.crimeType} ({dossier.urgency})
             </div>
             <p className="text-sm text-gray-300 bg-black/30 p-4 rounded-xl border border-gray-800">{dossier.description}</p>
             <div className="h-44 rounded-2xl overflow-hidden grayscale brightness-50 contrast-125 opacity-70">
                <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={()=>{}} />
             </div>
             <button onClick={downloadReport} className="flex items-center gap-2 text-[10px] text-gray-400 border border-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800">
                <Download size={12} /> DOWNLOAD REPORT
             </button>
          </div>
          <div className="space-y-6 text-right">
            {decryptedImage && <img src={decryptedImage} className="rounded-2xl border border-gray-800 w-full" />}
            <div className="grid grid-cols-2 gap-4">
               <button onClick={()=>writeContractAsync({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyReport', args:[BigInt(id)]})} className="bg-green-600 hover:bg-green-500 py-3 rounded-xl text-xs font-black uppercase transition-all">Verify</button>
               <button onClick={()=>writeContractAsync({address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'flagReport', args:[BigInt(id)]})} className="bg-red-900 hover:bg-red-800 py-3 rounded-xl text-xs font-black uppercase transition-all">Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}