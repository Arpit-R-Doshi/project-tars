'use client';
import { useState } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { generateZKProof } from '../../utils/zkp';
import { verifyShards } from '../../utils/security';
import ReportCard from '../../components/ReportCard';
import { ShieldAlert, Key, Terminal, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [zkSecret, setZkSecret] = useState('');
  
  // Super Log State
  const [showSuperLog, setShowSuperLog] = useState(false);
  const [shards, setShards] = useState(['', '', '', '', '']);
  const [isLogUnlocked, setIsLogUnlocked] = useState(false);

  const { data: reportCount } = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reportCount' 
  });

  const { data: superLogs }: any = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getAllLogs',
    query: { enabled: isLogUnlocked }
  });

  const handleZKLogin = async () => {
    try {
      const { proof, leaf } = generateZKProof(zkSecret);
      const isValid = await publicClient?.readContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyAuthority',
        args: [proof as `0x${string}`[], leaf as `0x${string}`],
      });
      if (isValid) setIsAdmin(true);
      else alert("Invalid ZK-Secret");
    } catch (e) { alert("Verification Failed"); }
  };

  const unlockSuperLog = () => {
    if (verifyShards(shards)) setIsLogUnlocked(true);
    else alert("Forensic Override Failed: Incorrect Shard Sequence.");
  };

  if (!isConnected) return <div className="p-20 text-center font-mono">ESTABLISHING SECURE LINK...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {!isAdmin ? (
        <div className="max-w-md mx-auto bg-gray-900 p-10 rounded-3xl border border-gray-800 shadow-2xl">
          <Lock className="text-blue-500 mx-auto mb-6" size={40} />
          <h2 className="text-xl font-bold mb-6 text-center">AUTHORITY LOGIN</h2>
          <input type="password" placeholder="Passphrase Secret" className="w-full bg-black border border-gray-800 p-4 rounded-xl mb-4 outline-none focus:border-blue-500" onChange={(e)=>setZkSecret(e.target.value)} />
          <button onClick={handleZKLogin} className="w-full bg-blue-600 py-4 rounded-xl font-bold tracking-widest">VERIFY ZK-PROOF</button>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black uppercase tracking-widest text-blue-500">Authority Terminal</h2>
            <button 
                onClick={() => setShowSuperLog(!showSuperLog)}
                className="flex items-center gap-2 bg-red-900/20 text-red-500 border border-red-900/50 px-6 py-2 rounded-xl text-xs font-bold hover:bg-red-900/40 transition-all"
            >
                <ShieldAlert size={14} /> {showSuperLog ? "CLOSE AUDIT" : "OPEN SUPER LOG"}
            </button>
          </div>

          {!showSuperLog ? (
            <div className="max-w-4xl mx-auto">
              {reportCount && Array.from({length: Number(reportCount)}).map((_, i) => (
                 <ReportCard key={i} id={Number(reportCount) - i} zkSecret={zkSecret} />
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-red-900/30 rounded-3xl p-8">
               <div className="flex items-center gap-3 mb-8">
                  <Terminal className="text-red-500" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Forensic Audit Terminal</h3>
               </div>

               {!isLogUnlocked ? (
                 <div className="max-w-sm mx-auto space-y-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6 leading-tight">Emergency Override Required. Provide 5 Shards to reconstruct Master Key.</p>
                    {shards.map((shard, i) => (
                        <input 
                            key={i} type="password" placeholder={`SHARD_0${i+1}`} 
                            className="w-full bg-black border border-red-900/20 p-3 rounded-xl text-xs text-center font-mono outline-none focus:border-red-500"
                            onChange={(e) => {
                                const s = [...shards]; s[i] = e.target.value; setShards(s);
                            }}
                        />
                    ))}
                    <button onClick={unlockSuperLog} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black text-xs uppercase mt-4 tracking-widest transition-all">Execute Reconstruction</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <span>Timestamp</span><span>Officer Wallet</span><span>Secret Leaf</span><span>Case ID</span>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {superLogs?.map((log: any, i: number) => (
                            <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-800/50 text-[11px] font-mono text-gray-400">
                                <span>{new Date(Number(log.timestamp)*1000).toLocaleString()}</span>
                                <span className="truncate">{log.officer}</span>
                                <span className="text-red-400 truncate">{log.officerLeaf}</span>
                                <span className="text-white font-bold pr-10">#{log.reportId.toString()}</span>
                            </div>
                        ))}
                        {superLogs?.length === 0 && <p className="text-center py-10 text-gray-600 italic">No access records detected in chain history.</p>}
                    </div>
                 </div>
               )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}