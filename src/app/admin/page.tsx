'use client';

import { useState } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { generateZKProof } from '../../utils/zkp';
import { verifyShards } from '../../utils/security';
import ReportCard from '../../components/ReportCard';
import { ShieldAlert, Terminal, Lock, Key, Activity, Database, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  // --- Auth State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [zkSecret, setZkSecret] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // --- Super Log / Forensic State ---
  const [showSuperLog, setShowSuperLog] = useState(false);
  const [shards, setShards] = useState(['', '', '', '', '']);
  const [isLogUnlocked, setIsLogUnlocked] = useState(false);

  // --- Blockchain Data ---
  const { data: reportCount } = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reportCount' 
  });

  // Fetching the Super Logs (Enabled only when forensic terminal is unlocked)
  const { data: superLogs }: any = useReadContract({
    address: CONTRACT_ADDRESS, 
    abi: CONTRACT_ABI, 
    functionName: 'getAllLogs',
    query: { enabled: isLogUnlocked }
  });

  const handleZKLogin = async () => {
    if (!zkSecret) return;
    setIsVerifying(true);
    try {
      const { proof, leaf } = generateZKProof(zkSecret);
      const isValid = await publicClient?.readContract({
        address: CONTRACT_ADDRESS, 
        abi: CONTRACT_ABI, 
        functionName: 'verifyAuthority',
        args: [proof as `0x${string}`[], leaf as `0x${string}`],
      });

      if (isValid) setIsAdmin(true);
      else alert("ZK-AUTH REJECTED: Passphrase not found in Merkle Root.");
    } catch (e) {
      alert("Verification Failed. Check console for details.");
    } finally {
      setIsVerifying(false);
    }
  };

  const unlockSuperLog = () => {
    if (verifyShards(shards)) {
      setIsLogUnlocked(true);
    } else {
      alert("Nuclear Override Failed: Shard sequence is invalid.");
    }
  };

  if (!isConnected) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Database className="mx-auto text-gray-800 animate-pulse" size={48} />
        <p className="text-gray-600 font-mono text-xs tracking-[0.3em] uppercase">Node Link Required</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {!isAdmin ? (
        /* --- AUTHORITY LOGIN UI --- */
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-gray-900 p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl"
        >
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Lock className="text-blue-500" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-center mb-2 tracking-tighter">AUTHORITY LOGIN</h2>
          <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest mb-8">Secure Disclosure Network V2.0</p>
          
          <div className="space-y-4">
              <input 
                type="password" 
                placeholder="Authority Passphrase..." 
                className="w-full bg-black border border-gray-800 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-mono text-sm" 
                onChange={(e)=>setZkSecret(e.target.value)} 
              />
              <button 
                onClick={handleZKLogin} 
                disabled={isVerifying || !zkSecret}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black tracking-widest text-xs transition-all shadow-lg shadow-blue-900/20"
              >
                {isVerifying ? "GENERATING PROOF..." : "EXECUTE ZK-AUTH"}
              </button>
          </div>
        </motion.div>
      ) : (
        /* --- LOGGED IN DASHBOARD --- */
        <div className="max-w-7xl mx-auto">
          
          {/* Header Controls */}
          <div className="flex flex-wrap justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 text-blue-500 mb-2">
                <Activity size={20} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Online</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Authority Terminal</h1>
            </div>

            <button 
                onClick={() => setShowSuperLog(!showSuperLog)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                    showSuperLog 
                    ? "bg-gray-800 border-gray-700 text-white" 
                    : "bg-red-900/10 border-red-900/40 text-red-500 hover:bg-red-900/20"
                }`}
            >
                {showSuperLog ? <Activity size={16} /> : <ShieldAlert size={16} />}
                {showSuperLog ? "Return to Cases" : "Open Super Log"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showSuperLog ? (
              /* FEED: List of Reports */
              <motion.div 
                key="feed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-2"
              >
                <div className="flex items-center gap-2 mb-6 text-gray-500">
                    <History size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recent Disclosures ({reportCount?.toString()})</span>
                </div>
                {reportCount && Array.from({length: Number(reportCount)}).map((_, i) => (
                    <ReportCard key={i} id={Number(reportCount) - i} zkSecret={zkSecret} />
                ))}
                {Number(reportCount) === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-900 rounded-[3rem]">
                        <p className="text-gray-700 font-mono italic">No cases detected in decentralized buffer.</p>
                    </div>
                )}
              </motion.div>
            ) : (
              /* FORENSIC TERMINAL: Super Log UI */
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="bg-gray-900/50 border border-red-900/20 rounded-[3rem] p-10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-800">
                    <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/40">
                        <Terminal className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Forensic Audit Terminal</h3>
                        <p className="text-[10px] text-red-500/60 font-mono tracking-widest uppercase">Immutable Chain Access Logs</p>
                    </div>
                </div>

                {!isLogUnlocked ? (
                  /* SHARDED LOCK UI */
                  <div className="max-w-sm mx-auto text-center space-y-6">
                    <div className="space-y-2">
                        <Lock className="mx-auto text-red-900 mb-2" size={32} />
                        <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-relaxed">
                            Emergency Override Protocol:<br/> Provide 5 Authorized Key Shards
                        </p>
                    </div>
                    
                    <div className="grid gap-3">
                        {shards.map((shard, i) => (
                            <div key={i} className="relative">
                                <Key className="absolute left-4 top-3.5 text-red-900" size={14} />
                                <input 
                                    type="password" 
                                    placeholder={`FRAG_0${i+1}`} 
                                    className="w-full bg-black border border-red-900/20 p-3.5 pl-12 rounded-2xl text-xs text-center font-mono outline-none focus:border-red-500 transition-all placeholder:text-red-900/30"
                                    onChange={(e) => {
                                        const s = [...shards]; s[i] = e.target.value; setShards(s);
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={unlockSuperLog} 
                        className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 transition-all active:scale-95"
                    >
                        Reconstruct Master Key
                    </button>
                  </div>
                ) : (
                  /* REVEALED LOG DATA */
                  <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="grid grid-cols-5 gap-6 pb-4 text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-800">
                        <span>Timestamp</span>
                        <span>Officer Wallet</span>
                        <span>Action</span>
                        <span>ZK Identifier</span>
                        <span className="text-right">Case ID</span>
                    </div>
                    
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {superLogs?.map((log: any, i: number) => (
                            <div key={i} className="grid grid-cols-5 gap-6 py-4 border-b border-gray-800/40 text-[11px] font-mono items-center hover:bg-white/5 transition-colors px-2 rounded-lg">
                                <span className="text-gray-500">{new Date(Number(log.timestamp)*1000).toLocaleString()}</span>
                                <span className="truncate text-gray-400 bg-gray-950 p-1.5 rounded border border-gray-800">{log.officer}</span>
                                <span className={`font-black text-[9px] px-2 py-1 rounded border ${
                                    log.action === "VOTE_VALIDATE" ? "text-green-500 border-green-900/50 bg-green-900/10" : "text-blue-400 border-blue-900/50 bg-blue-900/10"
                                }`}>
                                    {log.action}
                                </span>
                                <span className="text-red-400/80 truncate italic">{log.officerLeaf}</span>
                                <span className="text-right text-white font-bold text-lg">#{log.reportId.toString()}</span>
                            </div>
                        ))}
                        
                        {superLogs?.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-gray-600 italic font-mono uppercase text-xs tracking-widest">No access history found on-chain.</p>
                            </div>
                        )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}