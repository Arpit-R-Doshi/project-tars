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
  Edit3,
  Calendar,
  Clock
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-900 animate-pulse flex items-center justify-center text-gray-700 font-mono text-xs">INITIALIZING SATELLITE...</div>
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
  
  // New: Incident Date & Time
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState("12:00");

  const [location, setLocation] = useState<[number, number] | null>(null);
  const [addressName, setAddressName] = useState('Searching...');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        setLocation([data.latitude, data.longitude]);
        setAddressName(`${data.city}, ${data.country_name}`);
      }).catch(() => setAddressName("Location blocked. Enter manually."));
  }, []);

  const handleSubmit = async () => {
    if (!file || !isConnected) return;
    setIsUploading(true);
    setStatus('PURGING METADATA...');

    try {
      const KEY = "tars-hackathon-secret-key";
      const { cleanFile }: any = await scrubEvidence(file);
      const encryptedImg = await encryptFile(cleanFile, KEY);
      const imgCid = await uploadToIPFS(encryptedImg);
      
      const dossier = { 
        crimeType: isCustomCrime ? customCrime : crimeType,
        urgency,
        description, 
        incidentDate,   // Added to Dossier
        incidentTime,   // Added to Dossier
        location: { lat: location?.[0], lng: location?.[1], name: addressName }, 
        evidenceImage: imgCid, 
        timestamp: new Date().toISOString() 
      };

      const encryptedDossier = encryptText(JSON.stringify(dossier), KEY);
      const dossierCid = await uploadToIPFS(new Blob([encryptedDossier], {type:'text/plain'}));

      writeContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
        functionName: 'submitReport', args: [dossierCid],
      }, { 
        onSuccess: () => { setStatus('SUBMITTED SUCCESSFULLY'); setIsUploading(false); },
        onError: (err) => { setStatus('ERROR: ' + err.message); setIsUploading(false); }
      });
    } catch (e: any) { setStatus('FAILED: ' + e.message); setIsUploading(false); }
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
          
          <div className="space-y-6 bg-gray-900/40 p-8 rounded-3xl border border-gray-800 shadow-2xl">
            {/* Category & Urgency */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</label>
                    <select 
                        className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500"
                        value={isCustomCrime ? "Other" : crimeType}
                        onChange={(e) => {
                            if (e.target.value === "Other") setIsCustomCrime(true);
                            else { setIsCustomCrime(false); setCrimeType(e.target.value); }
                        }}
                    >
                        <option>Corruption</option>
                        <option>Environmental</option>
                        <option>Human Rights</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Urgency</label>
                    <select className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500" onChange={(e) => setUrgency(e.target.value)}>
                        <option>Low</option><option>Medium</option><option>High</option><option>CRITICAL</option>
                    </select>
                </div>
            </div>

            {/* NEW: Incident Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} /> Incident Date
                    </label>
                    <input 
                        type="date" 
                        className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 color-scheme-dark"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Incident Time
                    </label>
                    <input 
                        type="time" 
                        className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-blue-500 color-scheme-dark"
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                    />
                </div>
            </div>

            {isCustomCrime && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <input type="text" placeholder="Specify crime..." className="w-full bg-black border border-blue-900/40 p-3 rounded-xl text-sm outline-none" onChange={(e)=>setCustomCrime(e.target.value)} />
                </motion.div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                <textarea className="w-full bg-black border border-gray-800 rounded-xl p-4 h-32 outline-none focus:border-blue-500 text-sm" placeholder="Evidence details..." value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Media</label>
                <button onClick={() => fileInputRef.current?.click()} className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 transition-all ${file ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-gray-800 text-gray-600'}`}>
                    <Camera size={24} />
                    <span className="text-xs font-bold uppercase">{file ? file.name : "Select Media"}</span>
                </button>
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e)=>setFile(e.target.files![0])} />
            </div>

            <button onClick={handleSubmit} disabled={isUploading || !file} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-blue-900/20">
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'EXECUTE SUBMISSION'}
            </button>
          </div>

          <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800 flex flex-col h-full">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <MapPin size={12} /> Geographic Context
            </label>
            <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl p-3 mb-4">
                <Edit3 size={14} className="text-gray-600" />
                <input type="text" value={addressName} onChange={(e)=>setAddressName(e.target.value)} className="bg-transparent w-full text-xs text-blue-400 outline-none font-mono" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-800 flex-1 shadow-inner grayscale contrast-125 brightness-75">
                <MapPicker position={location} setPosition={setLocation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}