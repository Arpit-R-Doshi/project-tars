'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { scrubEvidence, encryptFile, encryptText, PrivacyAudit } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MapPin, AlertTriangle, FileText, Camera, Edit3, ShieldCheck, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

export default function SubmitPage() {
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [privacyAudit, setPrivacyAudit] = useState<PrivacyAudit | null>(null);
  const [isSanitizing, setIsSanitizing] = useState(false);
  
  const [crimeType, setCrimeType] = useState('Corruption');
  const [customCrime, setCustomCrime] = useState('');
  const [isCustomCrime, setIsCustomCrime] = useState(false);
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [addressName, setAddressName] = useState('Detecting location...');
  
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Auto-Location
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setLocation([data.latitude, data.longitude]);
        setAddressName(`${data.city}, ${data.country_name}`);
      }).catch(() => setAddressName("Manual Entry Required"));
  }, []);

  // Privacy Audit Trigger
  useEffect(() => {
    if (file) {
      setIsSanitizing(true);
      scrubEvidence(file).then(({ audit }) => {
        setPrivacyAudit(audit);
        setIsSanitizing(false);
      });
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!file || !isConnected) return;
    setIsUploading(true);
    setStatus('INITIATING PIXEL-WASH PROTOCOL...');

    try {
      const KEY = "tars-hackathon-secret-key";
      
      // 1. Scrub Media
      const { cleanFile } = await scrubEvidence(file);
      const encryptedImage = await encryptFile(cleanFile, KEY);
      const imageCid = await uploadToIPFS(encryptedImage);

      // 2. Package Dossier
      const dossier = {
        crimeType: isCustomCrime ? customCrime : crimeType,
        urgency,
        description,
        location: { lat: location?.[0], lng: location?.[1], name: addressName },
        evidenceImage: imageCid,
        timestamp: new Date().toISOString()
      };

      const encryptedDossier = encryptText(JSON.stringify(dossier), KEY);
      const dossierCid = await uploadToIPFS(new Blob([encryptedDossier], { type: 'text/plain' }));

      // 3. Chain Submission
      writeContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
        functionName: 'submitReport', args: [dossierCid],
      }, {
        onSuccess: () => {
          setStatus('DISCLOSURE ENCRYPTED & SUBMITTED TO POLYGON.');
          setIsUploading(false);
        },
        onError: (err) => {
          setStatus('BLOCKCHAIN REJECTED: ' + err.message);
          setIsUploading(false);
        }
      });
    } catch (err: any) {
      setStatus('CRITICAL ERROR: ' + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-black tracking-tighter text-blue-500">SUBMIT DISCLOSURE</h1>
          <ConnectButton />
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
            {/* Category */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Intelligence Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-black border border-gray-800 rounded-xl p-3 text-sm" onChange={(e) => {
                    setIsCustomCrime(e.target.value === "Other");
                    if(e.target.value !== "Other") setCrimeType(e.target.value);
                }}>
                  <option>Corruption</option><option>Human Rights</option><option>Environmental</option><option>Other</option>
                </select>
                <select className="bg-black border border-gray-800 rounded-xl p-3 text-sm" onChange={(e) => setUrgency(e.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option><option>CRITICAL</option>
                </select>
              </div>
              {isCustomCrime && <input type="text" placeholder="Specify category..." className="w-full bg-black border border-blue-900 rounded-xl p-3 text-sm mt-2" onChange={(e) => setCustomCrime(e.target.value)} />}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> Detailed Description
              </label>
              <textarea rows={4} className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm" placeholder="Evidence details..." onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Media & Audit */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} /> Media Evidence
              </label>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()} className={`w-full py-6 border-2 border-dashed rounded-2xl transition-all ${file ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 bg-gray-900/20'}`}>
                {file ? <div className="flex items-center justify-center gap-2 text-blue-400 font-bold"><CheckCircle2 size={16}/> {file.name}</div> : "Select Evidence Image"}
              </button>

              <AnimatePresence>
                {privacyAudit && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-blue-900/30 bg-blue-900/10">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <ShieldCheck size={14} /> <span className="text-[10px] font-black uppercase">Privacy Audit Complete</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {privacyAudit.foundMetadata ? `Sanitized ${privacyAudit.tagsRemoved.length} tracking tags. Image re-rendered via Canvas.` : "No metadata found. Applying pixel-wash for security."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            {/* Location */}
            <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <MapPin size={14} /> Incident Location
              </label>
              <div className="flex gap-2 mb-4 bg-black p-3 rounded-xl border border-gray-800">
                <Edit3 size={14} className="text-gray-600" />
                <input type="text" value={addressName} onChange={(e) => setAddressName(e.target.value)} className="bg-transparent w-full text-xs text-blue-400 outline-none" />
              </div>
              <MapPicker position={location} setPosition={setLocation} />
            </div>

            <button onClick={handleSubmit} disabled={isUploading || !file} className="w-full bg-linear-to-r from-blue-600 to-blue-700 py-4 rounded-2xl font-black tracking-widest shadow-xl shadow-blue-900/20">
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'SECURE SUBMISSION'}
            </button>
            {status && <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl text-blue-400 text-[10px] font-mono">{status}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}