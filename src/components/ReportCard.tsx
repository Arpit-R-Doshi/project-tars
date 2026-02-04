'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { decryptFile } from '../utils/security';
import { motion } from 'framer-motion';
import { Eye, ShieldCheck, ShieldAlert, BrainCircuit, User } from 'lucide-react';
import axios from 'axios';

export default function ReportCard({ id }: { id: number }) {
  // --- UI State ---
  const [decryptedImage, setDecryptedImage] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiReason, setAiReason] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // --- 1. Fetch Report Data from Contract ---
  // report structure: [id, ipfsCid, reporter, timestamp, verified, flagged]
  const { data: report }: { data: any } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'reports',
    args: [BigInt(id)],
  });

  // Extract variables safely using Array indices
  const r_cid = report ? report[1] : null;
  const reporterAddress = report ? report[2] : null;
  const r_verified = report ? report[4] : false;
  const r_flagged = report ? report[5] : false;

  // --- 2. Fetch Reporter's Reputation Score ---
  const { data: reporterScore } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTrustScore',
    args: reporterAddress ? [reporterAddress] : undefined,
  });

  // --- 3. Contract Write Hook ---
  const { writeContract } = useWriteContract();

  const handleDecrypt = async () => {
    if (!r_cid) {
      setError("CID not found");
      return;
    }
    setError('');
    
    const DEMO_KEY = "tars-hackathon-secret-key"; 
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://cloudflare-ipfs.com';
    const ipfsUrl = `${gateway}/ipfs/${r_cid}`;

    try {
      const image = await decryptFile(ipfsUrl, DEMO_KEY);
      setDecryptedImage(image);
    } catch (err) {
      setError('Decryption Failed. Check Gateway or Key.');
    }
  };

  const runAIAnalysis = async () => {
    if (!decryptedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post('/api/analyze', { imageBase64: decryptedImage });
      setAiScore(res.data.authenticityScore);
      setAiReason(res.data.confidenceReason);
    } catch (err) {
      setError('AI Analysis failed.');
    }
    setIsAnalyzing(false);
  };

  const updateOnChain = (action: 'verify' | 'flag') => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: action === 'verify' ? 'verifyReport' : 'flagReport',
      args: [BigInt(id)],
    });
  };

  // Loading Placeholder
  if (!report) return <div className="animate-pulse bg-gray-900 h-64 rounded-xl mb-6 border border-gray-800"></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6 shadow-2xl"
    >
      {/* HEADER SECTION: Now includes Reputation Badge */}
      <div className="bg-gray-950 p-4 border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-gray-500 text-[10px] tracking-widest uppercase">Protocol ID: #{id}</span>
          <div className="flex items-center gap-2 mt-1">
            <User size={12} className="text-gray-600" />
            <span className="text-[11px] text-gray-400 font-mono truncate w-40 md:w-64">
              {reporterAddress}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Reporter Reputation Badge */}
          <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Reporter Score</span>
              <span className={`text-sm font-mono font-bold ${Number(reporterScore) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {reporterScore?.toString() || '50'}/100
              </span>
          </div>

          <div className="flex gap-2">
              {r_verified && <span className="bg-green-900/30 text-green-400 px-2.5 py-1 text-[10px] font-bold rounded border border-green-800/50">VERIFIED</span>}
              {r_flagged && <span className="bg-red-900/30 text-red-400 px-2.5 py-1 text-[10px] font-bold rounded border border-red-800/50">FLAGGED</span>}
          </div>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Evidence & Decryption */}
        <div className="space-y-4">
          {!decryptedImage ? (
            <div className="space-y-4">
               <div className="bg-black p-4 rounded-lg border border-dashed border-gray-800 text-center py-10 flex flex-col items-center justify-center">
                  <Eye className="text-gray-700 mb-2" size={32} />
                  <p className="text-gray-600 text-xs font-mono uppercase tracking-widest">Encrypted Data Stream</p>
               </div>
               <button 
                 onClick={handleDecrypt} 
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95"
               >
                 Decrypt Evidence
               </button>
               {error && <p className="text-red-400 text-[10px] text-center uppercase font-bold">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
                <img src={decryptedImage} alt="Evidence" className="rounded-lg border border-gray-700 w-full shadow-inner" />
                <button 
                  onClick={runAIAnalysis} 
                  disabled={isAnalyzing} 
                  className="w-full flex items-center justify-center gap-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-800 py-3 rounded-lg transition-all"
                >
                  {isAnalyzing ? "Processing AI Audit..." : <><BrainCircuit size={18} /> Run Gemini AI Audit</>}
                </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Analysis & Verdict */}
        <div className="space-y-6">
            <div className="bg-black/40 p-5 rounded-xl border border-gray-800 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-4">Neural Analysis Engine</h3>
                  {aiScore !== null ? (
                    <div className="space-y-4">
                      <div className="flex items-end gap-2">
                        <span className={`text-5xl font-black ${aiScore > 75 ? 'text-green-400' : 'text-yellow-500'}`}>
                          {aiScore}%
                        </span>
                        <span className="text-gray-600 text-[10px] uppercase font-bold mb-1 tracking-tighter">Authenticity Score</span>
                      </div>
                      <p className="text-sm text-gray-300 italic border-l-2 border-purple-500 pl-4 py-1 leading-relaxed">
                        "{aiReason}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <BrainCircuit size={40} className="text-gray-800 mb-2 opacity-20" />
                        <p className="text-gray-700 text-xs font-mono">Awaiting decryption to initiate AI forensics...</p>
                    </div>
                  )}
                </div>

                {/* Final Verdict Actions */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <button 
                      onClick={() => updateOnChain('verify')} 
                      disabled={r_verified || r_flagged} 
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-20 disabled:grayscale text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                    >
                      <ShieldCheck size={16} /> Verify
                    </button>
                    <button 
                      onClick={() => updateOnChain('flag')} 
                      disabled={r_verified || r_flagged} 
                      className="bg-red-900/80 hover:bg-red-700 disabled:opacity-20 disabled:grayscale text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
                    >
                      <ShieldAlert size={16} /> Flag
                    </button>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}