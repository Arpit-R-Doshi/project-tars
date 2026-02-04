'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptData } from '../utils/security';
import { motion } from 'framer-motion';
import { Eye, ShieldCheck, ShieldAlert, BrainCircuit, MapPin, AlertCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ReportCard({ id }: { id: number }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: report }: { data: any } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)],
  });

  const { writeContract } = useWriteContract();

  const handleDecrypt = async () => {
    if (!report) return;
    const KEY = "tars-hackathon-secret-key";
    const dossierUrl = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${report[1]}`;

    try {
      // 1. Decrypt Dossier
      const res = await fetch(dossierUrl);
      const encText = await res.text();
      const decJson = JSON.parse(decryptData(encText, KEY));
      setDossier(decJson);

      // 2. Decrypt Image
      const imgRes = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${decJson.evidenceImage}`);
      const encImg = await imgRes.text();
      setDecryptedImage(decryptData(encImg, KEY));
    } catch (err) {
      setError('Decryption Failed. Keys or format mismatch.');
    }
  };

  if (!report) return <div className="animate-pulse bg-gray-900 h-64 rounded-3xl mb-6"></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-8 shadow-2xl">
      <div className="bg-black/50 p-4 flex justify-between items-center border-b border-gray-800">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Dossier ID: #{id}</span>
        <div className="flex gap-2">
            {report[4] && <span className="text-green-500 text-[10px] font-bold">VERIFIED</span>}
            {report[5] && <span className="text-red-500 text-[10px] font-bold">FLAGGED</span>}
        </div>
      </div>

      {!dossier ? (
        <div className="p-12 text-center">
          <button onClick={handleDecrypt} className="bg-blue-600 px-8 py-3 rounded-xl font-bold text-sm tracking-widest hover:bg-blue-500 transition-all">
            DECRYPT EVIDENCE DOSSIER
          </button>
          {error && <p className="text-red-500 text-xs mt-4 font-mono">{error}</p>}
        </div>
      ) : (
        <div className="p-8 grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
             <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 text-xs font-bold">
               <AlertCircle size={14} /> {dossier.crimeType} — {dossier.urgency} Urgency
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] text-gray-600 font-bold uppercase">Statement</label>
                <p className="text-sm text-gray-300 leading-relaxed">{dossier.description}</p>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] text-gray-600 font-bold uppercase">Incident Location</label>
                <div className="h-44 rounded-2xl overflow-hidden border border-gray-800 grayscale invert opacity-70">
                   <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={() => {}} />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-blue-500 font-mono">
                  <MapPin size={12} /> {dossier.location.name}
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] text-gray-600 font-bold uppercase">Sanitized Media Evidence</label>
            {decryptedImage && <img src={decryptedImage} className="rounded-2xl border border-gray-800 w-full shadow-inner" />}
            
            <div className="grid grid-cols-2 gap-4 mt-10">
                <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyReport', args: [BigInt(id)] })} className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black text-xs uppercase transition-all">Verify</button>
                <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'flagReport', args: [BigInt(id)] })} className="bg-red-900 hover:bg-red-800 py-3 rounded-xl font-black text-xs uppercase transition-all">Flag</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}