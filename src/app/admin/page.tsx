'use client';

import { useState } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { generateZKProof } from '../../utils/zkp';
import ReportCard from '../../components/ReportCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Key, Loader2, Database, Activity, Lock } from 'lucide-react';

export default function AdminDashboard() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  // --- UI State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [zkSecret, setZkSecret] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // --- 1. Fetch Total Report Count ---
  const { data: reportCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'reportCount',
  });

  // --- 2. ZK-Login Verification ---
  const handleZKLogin = async () => {
    if (!zkSecret) return;
    setIsVerifying(true);
    setError('');

    try {
      // A. Generate the Proof and Leaf locally
      const { proof, leaf } = generateZKProof(zkSecret);

      // B. Call the Smart Contract to verify membership in the Merkle Tree
      // We use the publicClient to call the 'verifyAuthority' view function
      const isValid = await publicClient?.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'verifyAuthority',
        args: [proof as `0x${string}`[], leaf as `0x${string}`],
      });

      if (isValid) {
        setIsAdmin(true);
        console.log("✅ ZK Proof Validated by Polygon Amoy");
      } else {
        setError("ZK Proof Invalid. Secret is not in the authorized registry.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Verification Error: Check console or contract deployment.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-800 pb-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <ShieldAlert className="text-red-500 h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">AUTHORITY TERMINAL</h1>
              <p className="text-gray-500 text-xs font-mono">TARS PROTOCOL V2 // ZK-ACCESS ENABLED</p>
            </div>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
            <Database className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h2 className="text-xl font-bold">Node Disconnected</h2>
            <p className="text-gray-500 mt-2">Establish wallet link to initialize the ZK-Auth sequence.</p>
          </motion.div>
        ) : !isAdmin ? (
          /* ZK LOGIN SCREEN */
          <div className="flex flex-col items-center justify-center py-10">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-gray-900 p-8 rounded-3xl border border-blue-900/30 shadow-2xl shadow-blue-900/10"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <Lock className="text-blue-500 w-8 h-8" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-2">Identify Authority</h2>
              <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
                Enter your unique passphrase. A Zero-Knowledge proof will be generated locally.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input 
                    type="password"
                    placeholder="ADMIN_SECRET_KEY"
                    className="w-full bg-black border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    onChange={(e) => setZkSecret(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleZKLogin()}
                  />
                </div>

                <button 
                  onClick={handleZKLogin}
                  disabled={isVerifying || !zkSecret}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  {isVerifying ? <Loader2 className="animate-spin" /> : 'GENERATE & VERIFY PROOF'}
                </button>

                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-red-400 text-xs text-center font-bold bg-red-900/10 py-2 rounded-lg border border-red-900/20"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        ) : (
          /* DASHBOARD SCREEN (LOGGED IN) */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Evidence Logs</div>
                <div className="text-4xl font-black text-blue-400">
                  {reportCount ? reportCount.toString() : '0'}
                </div>
              </div>
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Network Identity</div>
                <div className="text-sm font-mono text-green-400 truncate mt-2">
                  AUTHORIZED_ADMIN_NODE
                </div>
              </div>
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Chain Status</div>
                  <div className="text-green-500 font-bold text-sm">AMOY_TESTNET</div>
                </div>
                <Activity className="text-green-500 animate-pulse" />
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase">Incoming Disclosures</h3>
                <span className="text-[10px] text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">LIVE UPDATES</span>
              </div>

              {reportCount && Number(reportCount) > 0 ? (
                <div className="grid gap-6">
                  {Array.from({ length: Number(reportCount) }).map((_, index) => (
                    // Contract uses 1-based indexing for reports
                    <ReportCard key={index} id={Number(reportCount) - index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl">
                  <p className="text-gray-600 font-mono italic">No disclosures detected in the network buffer.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}