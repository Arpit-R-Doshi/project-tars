'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptFile } from '../utils/security';
import { motion } from 'framer-motion';
import { Eye, ShieldCheck, ShieldAlert, BrainCircuit, MapPin, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import CryptoJS from 'crypto-js';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

export default function ReportCard({ id }: { id: number }) {
  const [dossier, setDossier] = useState<any>(null);
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const { data: report }: { data: any } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reports', args: [BigInt(id)],
  });

  const { writeContract } = useWriteContract();

  const handleFullDecryption = async () => {
    if (!report) return;
    const DEMO_KEY = "tars-hackathon-secret-key";
    const dossierUrl = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${report[1]}`;

    try {
      // 1. Decrypt Dossier Text
      const response = await fetch(dossierUrl);
      const encryptedDossierText = await response.text();
      const bytes = CryptoJS.AES.decrypt(encryptedDossierText, DEMO_KEY);
      const decryptedDossier = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      setDossier(decryptedDossier);

      // 2. Decrypt Evidence Image inside Dossier
      const imageUrl = `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${decryptedDossier.evidenceImage}`;
      const image = await decryptFile(imageUrl, DEMO_KEY);
      setDecryptedImage(image);
    } catch (err) {
      setError('Decryption Failed: Invalid logic or keys.');
    }
  };

  if (!report) return <div className="animate-pulse bg-gray-900 h-64 rounded-xl mb-6"></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
      <div className="bg-black p-4 flex justify-between items-center border-b border-gray-800">
        <span className="text-xs font-mono text-gray-500">CASE_FILE: #{id}</span>
        <div className="flex gap-2">
            {report[4] && <span className="text-green-500 text-[10px] font-bold">● VERIFIED</span>}
            {report[5] && <span className="text-red-500 text-[10px] font-bold">● FLAGGED</span>}
        </div>
      </div>

      {!dossier ? (
        <div className="p-10 text-center">
          <button onClick={handleFullDecryption} className="bg-blue-600 px-6 py-3 rounded-lg font-bold">Decrypt Evidence Dossier</button>
          {error && <p className="text-red-500 text-xs mt-4">{error}</p>}
        </div>
      ) : (
        <div className="p-6 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-blue-400 font-bold">
               <AlertCircle size={16} /> {dossier.crimeType} ({dossier.urgency} Urgency)
             </div>
             <p className="text-sm text-gray-300 bg-black p-4 rounded-lg border border-gray-800">{dossier.description}</p>
             <div className="h-48 rounded-lg overflow-hidden grayscale">
               <MapPicker position={[dossier.location.lat, dossier.location.lng]} setPosition={() => {}} />
             </div>
             <div className="flex items-center gap-2 text-[10px] text-gray-500">
               <MapPin size={12} /> {dossier.location.name}
             </div>
          </div>

          <div className="space-y-4">
            {decryptedImage && <img src={decryptedImage} className="rounded-lg border border-gray-800 w-full" />}
            <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyReport', args: [BigInt(id)] })} className="bg-green-600 py-2 rounded font-bold text-xs uppercase">Verify</button>
                <button onClick={() => writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'flagReport', args: [BigInt(id)] })} className="bg-red-900 py-2 rounded font-bold text-xs uppercase">Flag</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}