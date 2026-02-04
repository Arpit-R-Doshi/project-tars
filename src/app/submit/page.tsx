'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { stripMetadata, encryptFile, encryptText } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { motion } from 'framer-motion';
import { Loader2, MapPin, AlertTriangle, FileText, Camera, Edit3, ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';

// Load Map without SSR
const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

export default function SubmitPage() {
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form State ---
  const [file, setFile] = useState<File | null>(null);
  const [crimeType, setCrimeType] = useState('Corruption');
  const [customCrime, setCustomCrime] = useState('');
  const [isCustomCrime, setIsCustomCrime] = useState(false);
  const [urgency, setUrgency] = useState('Medium');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [addressName, setAddressName] = useState('Searching location...');
  
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Auto-Detect Location
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setLocation([data.latitude, data.longitude]);
        setAddressName(`${data.city}, ${data.country_name}`);
      }).catch(() => setAddressName("Location blocked. Enter manually."));
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) {
        setStatus('Error: Evidence file is required.');
        return;
    }
    setIsUploading(true);
    setStatus('Protocol: Sanitizing Evidence...');

    try {
      const SIMULATED_KEY = "tars-hackathon-secret-key";
      
      // 1. Process Media
      const cleanFile = await stripMetadata(file);
      const encryptedImageBlob = await encryptFile(cleanFile, SIMULATED_KEY);
      const imageCid = await uploadToIPFS(encryptedImageBlob);

      // 2. Build Dossier
      const dossier = {
        crimeType: isCustomCrime ? customCrime : crimeType,
        urgency,
        description,
        location: { lat: location?.[0], lng: location?.[1], name: addressName },
        timestamp: new Date().toISOString(),
        evidenceImage: imageCid
      };

      const encryptedDossier = encryptText(JSON.stringify(dossier), SIMULATED_KEY);
      const dossierBlob = new Blob([encryptedDossier], { type: 'text/plain' });
      const dossierCid = await uploadToIPFS(dossierBlob);

      // 3. Chain Submission
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitReport',
        args: [dossierCid],
      }, {
        onSuccess: () => {
          setStatus('Dossier Immutable. Submission Confirmed.');
          setIsUploading(false);
          setFile(null);
          setDescription('');
        },
        onError: (err) => {
          setStatus('Contract Error: ' + err.message);
          setIsUploading(false);
        }
      });
    } catch (err: any) {
      setStatus('System Error: ' + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-black tracking-tighter text-blue-500 flex items-center gap-2">
            <ShieldCheck size={32} /> SUBMIT DISCLOSURE
          </h1>
          <ConnectButton />
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
            {/* Category */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <AlertTriangle size={14} /> Category & Priority
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="bg-black border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500"
                  value={isCustomCrime ? "Other" : crimeType}
                  onChange={(e) => {
                    if (e.target.value === "Other") setIsCustomCrime(true);
                    else { setIsCustomCrime(false); setCrimeType(e.target.value); }
                  }}
                >
                  <option>Corruption</option>
                  <option>Human Rights</option>
                  <option>Environmental</option>
                  <option>Fraud</option>
                  <option>Other</option>
                </select>
                <select className="bg-black border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500" onChange={(e) => setUrgency(e.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option><option>CRITICAL</option>
                </select>
              </div>
              {isCustomCrime && (
                <input 
                  type="text" 
                  placeholder="Specify custom category..." 
                  className="w-full bg-black border border-blue-900 rounded-xl p-3 text-sm mt-3"
                  onChange={(e) => setCustomCrime(e.target.value)}
                />
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <FileText size={14} /> Description
              </label>
              <textarea 
                rows={4} 
                className="w-full bg-black border border-gray-800 rounded-xl p-4 text-sm outline-none focus:border-blue-500" 
                placeholder="Details regarding the integrity breach..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>

            {/* Media Upload FIX */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Camera size={14} /> Media Evidence
              </label>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={(e) => e.target.files && setFile(e.target.files[0])} 
              />
              <button 
                onClick={handleFileClick}
                className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  file ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-800 hover:border-gray-700 bg-gray-900/20 text-gray-500'
                }`}
              >
                <Camera size={24} />
                <span className="text-xs font-bold">{file ? file.name : "Select Media File"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <MapPin size={14} /> Incident Location
              </label>
              <div className="flex gap-2 mb-4 bg-black p-3 rounded-xl border border-gray-800">
                <Edit3 size={16} className="text-gray-600" />
                <input 
                  type="text" 
                  value={addressName}
                  onChange={(e) => setAddressName(e.target.value)}
                  className="bg-transparent w-full text-xs text-blue-400 outline-none"
                />
              </div>
              <MapPicker position={location} setPosition={setLocation} />
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isUploading || !file || !isConnected} 
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:grayscale text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-900/20 text-sm tracking-widest"
            >
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'SECURE SUBMISSION'}
            </button>
            
            {status && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-[10px] font-mono uppercase tracking-tighter">
                    {status}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}