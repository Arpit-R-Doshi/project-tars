'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { scrubEvidence, encryptFile, encryptText } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  Camera, 
  ShieldCheck, 
  Clock, 
  Edit3 
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Map to prevent SSR errors in Next.js 14
const MapPicker = dynamic(() => import('../../components/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-900 animate-pulse rounded-2xl" />
});

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
  const [addressName, setAddressName] = useState('Detecting location...');
  
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [privacyAudit, setPrivacyAudit] = useState<any>(null);

  // Auto-Detect Location via IP
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setLocation([data.latitude, data.longitude]);
        setAddressName(`${data.city}, ${data.country_name}`);
      }).catch(() => setAddressName("Location blocked. Enter manually."));
  }, []);

  // Privacy Audit Trigger
  useEffect(() => {
    if (file) {
      scrubEvidence(file).then(({ audit }) => setPrivacyAudit(audit));
    } else {
      setPrivacyAudit(null);
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!file || !isConnected) {
        setStatus("ERROR: Establish wallet link and provide media.");
        return;
    }
    setIsUploading(true);
    setStatus('INITIATING PIXEL-WASH PROTOCOL...');

    try {
      const KEY = "tars-hackathon-secret-key";

      // 1. Scrub Media & Encrypt
      const { cleanFile }: any = await scrubEvidence(file);
      const encryptedImg = await encryptFile(cleanFile, KEY);
      const imgCid = await uploadToIPFS(encryptedImg);
      
      // 2. Package Dossier (JSON)
      const dossier = { 
        crimeType: isCustomCrime ? customCrime : crimeType,
        urgency,
        description, 
        location: { 
            lat: location?.[0], 
            lng: location?.[1], 
            name: addressName 
        }, 
        evidenceImage: imgCid, 
        timestamp: new Date().toISOString() 
      };

      // 3. Encrypt Dossier & Upload
      setStatus('ENCRYPTING DOSSIER PACKAGE...');
      const encryptedDossier = encryptText(JSON.stringify(dossier), KEY);
      const dossierCid = await uploadToIPFS(new Blob([encryptedDossier], {type:'text/plain'}));

      // 4. Submit Final CID to Blockchain
      setStatus('AWAITING CHAIN CONFIRMATION...');
      writeContract({
        address: CONTRACT_ADDRESS, 
        abi: CONTRACT_ABI,
        functionName: 'submitReport', 
        args: [dossierCid],
      }, { 
        onSuccess: () => { 
            setStatus('DISCLOSURE SUBMITTED. INTEGRITY SECURED.'); 
            setIsUploading(false); 
            setFile(null);
            setDescription('');
        },
        onError: (err) => {
            setStatus('CHAIN REJECTION: ' + err.message);
            setIsUploading(false);
        }
      });
    } catch (e: any) { 
        setStatus('PROCESS FAILED: ' + e.message); 
        setIsUploading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-500 w-8 h-8" />
            <h1 className="text-3xl font-black tracking-tighter uppercase">Submission Terminal</h1>
          </div>
          <ConnectButton />
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* Left Panel: Intelligence Data */}
          <div className="space-y-6 bg-gray-900/40 p-8 rounded-3xl border border-gray-800 shadow-2xl">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</label>
                    <select 
                        className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        value={isCustomCrime ? "Other" : crimeType}
                        onChange={(e) => {
                            if (e.target.value === "Other") setIsCustomCrime(true);
                            else { setIsCustomCrime(false); setCrimeType(e.target.value); }
                        }}
                    >
                        <option>Corruption</option>
                        <option>Environmental Crime</option>
                        <option>Financial Fraud</option>
                        <option>Human Rights Violation</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Urgency</label>
                    <select 
                      className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                      onChange={(e) => setUrgency(e.target.value)}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>CRITICAL</option>
                    </select>
                </div>
            </div>

            <AnimatePresence>
                {isCustomCrime && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Specify Category</label>
                        <input type="text" placeholder="Enter crime type..." className="w-full bg-black border border-blue-900/40 p-3 rounded-xl text-sm outline-none" onChange={(e)=>setCustomCrime(e.target.value)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={12} /> Evidence Statement
                </label>
                <textarea 
                    className="w-full bg-black border border-gray-800 rounded-xl p-4 h-32 outline-none focus:border-blue-500 transition-all text-sm leading-relaxed" 
                    placeholder="Describe the incident with as much detail as possible..." 
                    value={description}
                    onChange={(e)=>setDescription(e.target.value)} 
                />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={12} /> Media Evidence
                </label>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 transition-all ${file ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-gray-800 hover:border-blue-500 text-gray-600'}`}
                >
                    <Camera size={24} />
                    <span className="text-xs font-bold uppercase tracking-tighter">{file ? file.name : "Select Encrypted Media"}</span>
                </button>
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e)=>setFile(e.target.files![0])} />
                
                {privacyAudit && (
                  <div className="p-3 bg-blue-900/10 border border-blue-900/20 rounded-xl mt-2">
                    <p className="text-[9px] text-gray-400 font-mono leading-tight uppercase">
                       <span className="text-blue-500 font-bold">[AUDIT]</span> Metadata Scrubbing Active. 
                       {privacyAudit.foundMetadata ? ` Purging ${privacyAudit.tagsRemoved.length} tracking tags.` : " No headers found. Applying Pixel-Wash."}
                    </p>
                  </div>
                )}
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isUploading || !file} 
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 py-4 rounded-2xl font-black text-sm tracking-[0.2em] transition-all shadow-xl shadow-blue-900/20"
            >
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'EXECUTE SUBMISSION'}
            </button>
            
            {status && (
              <p className="text-center text-[10px] font-mono text-blue-400 uppercase tracking-widest animate-pulse">
                {status}
              </p>
            )}
          </div>

          {/* Right Panel: Geolocation Intelligence */}
          <div className="space-y-6">
             <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 flex flex-col h-full">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <MapPin size={12} /> Geo-Spatial Reference
                </label>
                
                <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl p-3 mb-4">
                    <Edit3 size={14} className="text-gray-600" />
                    <input 
                        type="text" 
                        value={addressName} 
                        onChange={(e)=>setAddressName(e.target.value)} 
                        className="bg-transparent w-full text-xs text-blue-400 outline-none font-mono"
                        placeholder="Manual location override..."
                    />
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-800 flex-1 shadow-inner grayscale contrast-125 brightness-75">
                    <MapPicker position={location} setPosition={setLocation} />
                </div>
                
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-600 font-mono">
                  <span>LAT: {location?.[0]?.toFixed(4)}</span>
                  <span>LNG: {location?.[1]?.toFixed(4)}</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}