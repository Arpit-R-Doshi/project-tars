'use client';
import ReportCard from '../../components/ReportCard';
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { motion } from 'framer-motion';
import { ShieldAlert, Key, Loader2, BrainCircuit } from 'lucide-react';

// Type definition for the Report struct from Solidity
interface Report {
  id: bigint;
  ipfsCid: string;
  reporter: string;
  timestamp: bigint;
  verified: boolean;
  flagged: boolean;
}

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // ZK-Login Simulation
  const { signMessageAsync } = useSignMessage();

  const handleLogin = async () => {
    try {
      const signature = await signMessageAsync({ 
        message: "Authorize TARS Admin Access: " + new Date().toISOString().split('T')[0] 
      });
      // In a real app, we would verify this signature on the backend against an allowlist.
      // For the hackathon, if they sign, we let them in.
      if (signature) setIsAdmin(true);
    } catch (err) {
      console.error("Login Failed", err);
    }
  };

  // Fetch Report Count
  const { data: reportCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'reportCount',
  });

  return (
    <div className="min-h-screen bg-black text-white p-8">
       <header className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-500 h-8 w-8" />
            <h1 className="text-3xl font-bold">Authority Dashboard</h1>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
           <div className="text-center mt-20">Please Connect Wallet</div>
        ) : !isAdmin ? (
            <div className="flex flex-col items-center mt-20 space-y-6">
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center max-w-md">
                    <Key className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
                    <p className="text-gray-400 mb-6">
                        Cryptographic signature required to access the TARS decryption protocol.
                    </p>
                    <button 
                        onClick={handleLogin}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition"
                    >
                        Sign to Authenticate
                    </button>
                </div>
            </div>
        ) : (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6"
            >
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Network Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black p-4 rounded-lg border border-gray-800">
                            <div className="text-gray-500 text-sm">Total Reports</div>
                            <div className="text-2xl font-mono text-blue-400">
                                {reportCount ? reportCount.toString() : '0'}
                            </div>
                        </div>
                        <div className="bg-black p-4 rounded-lg border border-gray-800">
                            <div className="text-gray-500 text-sm">Node Status</div>
                            <div className="text-green-400 font-mono text-sm mt-1">
                                ● ONLINE (Polygon Amoy)
                            </div>
                        </div>
                    </div>
                </div>

                {<div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Pending Submissions</h3>
                  {reportCount && Number(reportCount) > 0 ? (
                    Array.from({ length: Number(reportCount) }).map((_, index) => (
                      // Reports are 1-indexed in our contract logic, so index + 1
                      <ReportCard key={index} id={index + 1} />
                    ))
                  ) : (
                    <div className="text-gray-500">No reports submitted yet.</div>
                  )}
                </div>}
                <div className="text-center py-10 text-gray-500">
                    Authentication Successful. Loading Reports Logic...
                </div>

            </motion.div>
        )}
    </div>
  );
}