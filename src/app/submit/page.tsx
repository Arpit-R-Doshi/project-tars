'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { scrubEvidence, encryptFile, encryptText } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import TrustScore from '../../components/TrustScore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, MapPin, AlertTriangle, FileText, Camera, ShieldCheck, 
  Calendar, Clock, Edit3, AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-black/50 animate-pulse flex items-center justify-center text-gray-700 font-mono text-xs">INITIALIZING SATELLITE...</div>
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
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState("12:00");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [addressName, setAddressName] = useState('Searching...');
  
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [privacyAudit, setPrivacyAudit] = useState<any>(null);

  // Auto-Detect Location & Audit Trigger
  useEffect(() => {
    fetch('https://ipapi.co/json/').then(res => res.json()).then(data => {
      setLocation([data.latitude, data.longitude]);
      setAddressName(`${data.city}, ${data.country_name}`);
    }).catch(() => setAddressName("Manual Location Override"));
  }, []);

  useEffect(() => {
    if (file) {
      scrubEvidence(file).then(({ audit }) => setPrivacyAudit(audit));
    } else {
      setPrivacyAudit(null);
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!file || !isConnected) return;
    setIsUploading(true);
    setStatus('INITIATING PIXEL-WASH PROTOCOL...');

    try {
      const KEY = "tars-hackathon-secret-key";

      // 1. Scrub Media & Encrypt
      const { cleanFile }: any = await scrubEvidence(file);
      const encryptedImg = await encryptFile(cleanFile, KEY);
      const imgCid = await uploadToIPFS(encryptedImg);
      
      // 2. Build Full JSON Dossier
      const dossier = { 
        crimeType: isCustomCrime ? customCrime : crimeType,
        urgency,
        description, 
        incidentDate, incidentTime,
        location: { lat: location?.[0], lng: location?.[1], name: addressName }, 
        evidenceImage: imgCid, 
        timestamp: new Date().toISOString() 
      };

      // 3. Encrypt Dossier & Upload
      const encryptedDossier = encryptText(JSON.stringify(dossier), KEY);
      const dossierCid = await uploadToIPFS(new Blob([encryptedDossier], {type:'text/plain'}));

      // 4. Submit Final CID to Blockchain
      writeContract({
        address: CONTRACT_ADDRESS, 
        abi: CONTRACT_ABI,
        functionName: 'submitReport', 
        args: [dossierCid],
      }, { 
        onSuccess: () => { setStatus('DISCLOSURE SUBMITTED. INTEGRITY SECURED.'); setIsUploading(false); },
        onError: (err) => { setStatus('CHAIN REJECTION: ' + err.message); setIsUploading(false); }
      });
    } catch (e: any) { setStatus('PROCESS FAILED: ' + e.message); setIsUploading(false); }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 relative z-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="glass-header py-4 sticky top-20 z-40">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-500 w-8 h-8" />
                <h1 className="text-3xl font-black tracking-tighter uppercase">Submission Terminal</h1>
              </div>
              <div className="flex items-center gap-4">
                <TrustScore />
                <ConnectButton />
              </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* Left Panel: Intelligence Data */}
          <div className="space-y-6 glass-panel p-8 rounded-[2.5rem] shadow-2xl">
            
            {/* Category & Urgency */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={12}/> Category</label>
                    <select 
                        className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                        value={isCustomCrime ? "Other" : crimeType}
                        onChange={(e) => {
                            if (e.target.value === "Other") setIsCustomCrime(true);
                            else { setIsCustomCrime(false); setCrimeType(e.target.value); }
                        }}
                    >
                        <option>Corruption</option><option>Environmental</option><option>Human Rights</option><option>Other</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Urgency</label>
                    <select className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors" onChange={(e) => setUrgency(e.target.value)}>
                        <option>Low</option><option>Medium</option><option>High</option><option>CRITICAL</option>
                    </select>
                </div>
            </div>

            {/* Incident Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Incident Date</label>
                    <input type="date" className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Incident Time</label>
                    <input type="time" className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} />
                </div>
            </div>

            {isCustomCrime && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <input type="text" placeholder="Specify crime..." className="w-full bg-black border border-blue-900/40 p-3 rounded-xl text-sm outline-none" onChange={(e)=>setCustomCrime(e.target.value)} />
                </motion.div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Evidence Statement</label>
                <textarea className="w-full bg-black border border-gray-800 rounded-xl p-4 h-32 outline-none focus:border-blue-500 transition-all text-sm" placeholder="Provide a detailed description of the incident..." value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Media Evidence</label>
                <button onClick={() => fileInputRef.current?.click()} className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 transition-all ${file ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-gray-800 text-gray-600'}`}>
                    <Camera size={24} />
                    <span className="text-xs font-bold uppercase">{file ? file.name : "Upload Verified Media"}</span>
                </button>
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e)=>setFile(e.target.files![0])} />
                
                {privacyAudit && (
                  <div className="p-3 bg-blue-900/10 border border-blue-900/20 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-mono leading-tight uppercase">
                       <span className="text-blue-500 font-bold">[AUDIT]</span> Metadata Scrubbing Active. 
                       {privacyAudit.foundMetadata ? ` Purging ${privacyAudit.tagsRemoved.length} tracking tags.` : " No headers found. Applying Pixel-Wash."}
                    </p>
                  </div>
                )}
            </div>

            <button onClick={handleSubmit} disabled={isUploading || !file} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-blue-900/20 active:scale-95">
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'EXECUTE SUBMISSION'}
            </button>
            {status && <p className="text-center text-[10px] font-mono text-blue-400 uppercase tracking-widest animate-pulse">{status}</p>}
          </div>

          {/* Right Panel: Geolocation Intelligence */}
          <div className="space-y-6 glass-panel p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <MapPin size={12} /> Geographic Context
            </label>
            
            <div className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-xl p-3 mb-4">
                <Edit3 size={14} className="text-gray-600" />
                <input type="text" value={addressName} onChange={(e)=>setAddressName(e.target.value)} className="bg-transparent w-full text-xs text-blue-400 outline-none font-mono" placeholder="Manual location override..." />
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-800 flex-1 shadow-inner grayscale contrast-125 brightness-75 transition-all hover:grayscale-0 hover:brightness-100">
                <MapPicker position={location} setPosition={setLocation} />
            </div>
            <p className="text-[9px] text-gray-600 font-mono tracking-widest text-center mt-3">
                LAT: {location?.[0]?.toFixed(5)} // LNG: {location?.[1]?.toFixed(5)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}