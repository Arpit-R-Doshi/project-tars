'use client';
import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { scrubEvidence, encryptFile, encryptText } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { Loader2, MapPin, ShieldCheck, Camera } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('../../components/MapPicker'), { ssr: false });

export default function SubmitPage() {
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [addressName, setAddressName] = useState('Detecting...');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/').then(res => res.json()).then(data => {
      setLocation([data.latitude, data.longitude]);
      setAddressName(`${data.city}, ${data.country_name}`);
    }).catch(() => setAddressName("Manual Entry"));
  }, []);

  const handleSubmit = async () => {
    if (!file || !isConnected) return;
    setIsUploading(true);
    setStatus('WASHING EVIDENCE...');
    try {
      const KEY = "tars-hackathon-secret-key";
      const { cleanFile }: any = await scrubEvidence(file);
      const imgCid = await uploadToIPFS(await encryptFile(cleanFile, KEY));
      
      const dossier = { 
        description, 
        location: { lat: location?.[0], lng: location?.[1], name: addressName }, 
        evidenceImage: imgCid, 
        timestamp: new Date().toISOString() 
      };

      const dossierCid = await uploadToIPFS(new Blob([encryptText(JSON.stringify(dossier), KEY)], {type:'text/plain'}));

      writeContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
        functionName: 'submitReport', args: [dossierCid],
      }, { onSuccess: () => { setStatus('SUBMITTED SUCCESSFULLY'); setIsUploading(false); } });
    } catch (e: any) { setStatus('FAILED: ' + e.message); setIsUploading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <h1 className="text-2xl font-black text-blue-500 flex items-center gap-2">
            <ShieldCheck size={28} /> SUBMISSION TERMINAL
          </h1>
          <div className="flex items-center gap-4">
            {/* REMOVED TrustScore component from here */}
            <ConnectButton />
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800 space-y-6">
            <textarea className="w-full bg-black border border-gray-800 rounded-xl p-4 h-32 outline-none focus:border-blue-500" placeholder="Describe evidence..." onChange={(e)=>setDescription(e.target.value)} />
            
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:border-blue-500 transition-colors">
              {file ? file.name : "Select Media Evidence"}
            </button>
            <input type="file" hidden ref={fileInputRef} onChange={(e)=>setFile(e.target.files![0])} />

            <button onClick={handleSubmit} disabled={isUploading || !file} className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
              {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'SECURE SUBMISSION'}
            </button>
            {status && <p className="text-center text-[10px] font-mono text-blue-400 uppercase tracking-widest">{status}</p>}
          </div>
          <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
             <div className="text-xs text-blue-400 font-mono mb-4 flex items-center gap-2"><MapPin size={12}/> {addressName}</div>
             <MapPicker position={location} setPosition={setLocation} />
          </div>
        </div>
      </div>
    </div>
  );
}