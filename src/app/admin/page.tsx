'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { generateZKProof } from '../../utils/zkp';
import { verifyShards } from '../../utils/security';
import ReportCard from '../../components/ReportCard';
import { 
  ShieldAlert, Terminal, Lock, Activity, 
  SortAsc, Download, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
// removed pdf-lib import as it is no longer needed

export default function AdminDashboard() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [isAdmin, setIsAdmin] = useState(false);
  const [zkSecret, setZkSecret] = useState('tars-authority-alpha-99');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // --- Local State for Toggling Views ---
  const [showLogsView, setShowLogsView] = useState(false);

  // --- Sorting & Filtering State ---
  const [logSortBy, setLogSortBy] = useState<'TIME' | 'WALLET' | 'SECRET' | 'CASE'>('TIME'); 
  const [shards, setShards] = useState(['TARS', 'ALPHA', 'SECURITY', 'OMEGA', 'PROTOCOL']);
  const [isLogUnlocked, setIsLogUnlocked] = useState(false);

  // --- Data Fetching ---
  const { data: reportCount } = useReadContract({ 
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'reportCount' 
  });

  const { data: superLogs }: any = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getAllLogs',
    query: { enabled: isLogUnlocked }
  });

  const handleZKLogin = async () => {
    if (!zkSecret) return;
    setIsVerifying(true);
    try {
      const { proof, leaf } = generateZKProof(zkSecret);
      const isValid = await publicClient?.readContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'verifyAuthority',
        args: [proof as `0x${string}`[], leaf as `0x${string}`],
      });
      if (isValid) setIsAdmin(true);
      else alert("ZK-AUTH REJECTED");
    } catch (e) { alert("Verification Failed"); }
    finally { setIsVerifying(false); }
  };

  const unlockSuperLog = () => {
    if (verifyShards(shards)) setIsLogUnlocked(true);
    else alert("Invalid Shard Sequence.");
  };

  // --- Super Log Sorting Engine ---
  const sortedLogs = useMemo(() => {
    if (!superLogs) return [];
    let logs = [...superLogs];
    if (logSortBy === 'WALLET') logs.sort((a, b) => a.officer.localeCompare(b.officer));
    if (logSortBy === 'SECRET') logs.sort((a, b) => a.officerLeaf.localeCompare(b.officerLeaf));
    if (logSortBy === 'CASE') logs.sort((a, b) => Number(a.reportId) - Number(b.reportId));
    if (logSortBy === 'TIME') logs.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return logs;
  }, [superLogs, logSortBy]);

  // --- Official PDF Generator for Super Log ---
  const downloadSuperLogPDF = async () => {
    if (!sortedLogs || sortedLogs.length === 0) return;

    // 1. Declare Password ONCE
    const HARDCODED_PASSWORD = "tars-audit-secure-2024";

    const password = window.prompt("Enter PDF Password:", "");
    if (!password || password !== HARDCODED_PASSWORD) {
      alert("Incorrect password. PDF generation cancelled.");
      return;
    }

    // 2. Initialize jsPDF with built-in Encryption
    // This removes the need for pdf-lib entirely
    const doc = new jsPDF({
      orientation: 'l',
      //unit: 'mm',
      format: 'a4',
      encryption: {
        userPassword: HARDCODED_PASSWORD,
        ownerPassword: HARDCODED_PASSWORD,
        userPermissions: ["print", "modify", "copy", "annot-forms"],
        //encryptionAlgorithm: "aes",
        //keyLength: 128
      }
    });

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 297, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(20);
    doc.text("TARS SYSTEM FORENSIC AUDIT TRAIL", 15, 20);
    doc.setFontSize(8);
    doc.text(`GENERATED: ${new Date().toLocaleString()} // SECURITY LEVEL: 5 // SOURCE: POLYGON_AMOY_CHAIN`, 15, 28);

    doc.setTextColor(0, 0, 0);
    let y = 50;
    doc.setFontSize(9);
    doc.setFont("courier", "bold");
    doc.text("TIMESTAMP", 15, y);
    doc.text("OFFICER WALLET", 65, y);
    doc.text("ACTION", 135, y);
    doc.text("SECRET IDENTIFIER", 175, y);
    doc.text("CASE ID", 260, y);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 2, 282, y + 2);

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    y += 10;

    sortedLogs.forEach((log: any) => {
        if (y > 185) { doc.addPage('l'); y = 20; } //addPage('l', 'mm', 'a4')
        const time = new Date(Number(log.timestamp) * 1000).toLocaleString();
        const wallet = `${log.officer.substring(0, 18)}...`;

        // Explicit String conversion prevents TS argument errors
        doc.text(String(time), 15, y);
        doc.text(String(wallet), 65, y);
        doc.text(String(log.action), 135, y);
        doc.text(String(log.officerLeaf).substring(0, 30), 175, y);
        
        doc.setTextColor(0, 102, 204);
        doc.text(`#${String(log.reportId)}`, 260, y);
        doc.setTextColor(0, 0, 0);

        y += 8;
    });

    // 3. Simple Save (Already Encrypted)
    doc.save(`TARS-AUDIT-LOG-${Date.now()}.pdf`);
  };

  if (!isConnected) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-gray-500">LINK_REQUIRED</div>;

  return (
    <div className="min-h-screen p-6 md:p-12 relative z-10">
      {!isAdmin ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto glass-panel p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex justify-center mb-8"><Lock className="text-blue-500" size={32} /></div>
          <h2 className="text-2xl font-black text-center mb-8 tracking-tighter uppercase">Authority Login</h2>
          <input
            type="password"
            placeholder="Authority Secret..."
            className="w-full bg-black border border-gray-800 p-4 rounded-2xl mb-4 font-mono text-sm outline-none focus:border-blue-500"
            value={zkSecret}
            onChange={(e) => setZkSecret(e.target.value)}
          />
          <button onClick={handleZKLogin} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black tracking-widest text-xs transition-all">{isVerifying ? "VERIFYING..." : "EXECUTE ZK-AUTH"}</button>
        </motion.div>
      ) : (
        <div className="max-w-7xl mx-auto">
          
          <div className="glass-header py-4 flex flex-wrap justify-between items-end mb-8 gap-8 sticky top-20 z-40">
            <div className="flex items-center gap-3">
                <Activity size={18} className="text-blue-500 animate-pulse" />
                <h1 className="text-3xl font-black tracking-tighter uppercase">Authority Terminal</h1>
            </div>
            
            <button 
                onClick={() => setShowLogsView(!showLogsView)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${showLogsView ? "bg-white text-black border-white" : "bg-red-900/10 border-red-900/40 text-red-500 hover:bg-red-900/20"}`}
            >
                <ShieldAlert size={16} /> {showLogsView ? "Return to Cases" : "Open Super Log"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showLogsView ? (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                
                {/* --- FILTER COMMAND BAR --- */}
                <div className="glass-panel border border-gray-800 p-4 rounded-2xl flex flex-wrap items-center gap-6 shadow-xl sticky top-36 z-30">
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-gray-800">
                        <Filter size={14} className="text-gray-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By:</span>
                        <select className="bg-transparent text-[10px] font-bold text-gray-300 uppercase outline-none cursor-pointer">
                            <option>Status: All</option>
                            <option>Status: Pending</option>
                            <option>Status: Verified</option>
                        </select>
                        <select className="bg-transparent text-[10px] font-bold text-gray-300 uppercase outline-none cursor-pointer">
                            <option>Urgency: All</option>
                            <option>Urgency: Critical</option>
                            <option>Urgency: High</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-gray-800">
                        <SortAsc size={14} className="text-gray-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort Order:</span>
                        <select className="bg-transparent text-[10px] font-bold text-gray-300 uppercase outline-none cursor-pointer">
                            <option>Newest First</option>
                            <option>Oldest First</option>
                        </select>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    {reportCount && Array.from({length: Number(reportCount)}).map((_, i) => {
                        const caseId = Number(reportCount) - i;
                        return <ReportCard key={`case-${caseId}`} id={caseId} zkSecret={zkSecret} />;
                    })}
                </div>
              </motion.div>
            ) : (
              <motion.div key="audit" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel border border-red-900/20 rounded-[3rem] p-10 shadow-2xl">
                <div className="flex flex-wrap justify-between items-start mb-10 pb-6 border-b border-gray-800 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/40"><Terminal className="text-white" size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Forensic Audit Terminal</h3>
                            <p className="text-[10px] text-red-500/60 font-mono tracking-widest uppercase">Immutable Forensic Logs</p>
                        </div>
                    </div>

                    {isLogUnlocked && (
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 bg-black p-1.5 rounded-xl border border-gray-800">
                                <span className="text-[9px] font-black text-gray-500 uppercase px-2">Sort:</span>
                                {['TIME', 'WALLET', 'SECRET', 'CASE'].map((type) => (
                                    <button 
                                        key={type}
                                        onClick={() => setLogSortBy(type as any)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${logSortBy === type ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "bg-gray-900 text-gray-600 hover:text-gray-400"}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                onClick={downloadSuperLogPDF}
                                className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-xl"
                            >
                                <Download size={14} /> Download Trail
                            </button>
                        </div>
                    )}
                </div>

                {!isLogUnlocked ? (
                  <div className="max-w-sm mx-auto text-center space-y-6 py-10">
                    <Lock className="mx-auto text-red-900 mb-2" size={32} />
                    <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest">Emergency Override Required</p>
                    <div className="grid gap-3">
                    {shards.map((shard, i) => (
                      <input
                        key={i}
                        type="password"
                        placeholder={`FRAG_0${i + 1}`}
                        className="w-full bg-black border border-red-900/20 p-4 rounded-2xl text-xs text-center font-mono outline-none focus:border-red-500 transition-all"
                        value={shard}
                        onChange={(e) => {
                          const s = [...shards];
                          s[i] = e.target.value;
                          setShards(s);
                        }}
                      />
                    ))}
                    </div>
                    <button onClick={unlockSuperLog} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20">Execute Reconstruction</button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-5 gap-6 pb-4 text-[10px] font-black text-gray-600 uppercase tracking-widest border-b border-gray-800 px-4">
                        <span>Timestamp</span><span>Officer Wallet</span><span>Action</span><span>ZK Identifier</span><span className="text-right">Case ID</span>
                    </div>
                    <div className="space-y-2 max-h-125 overflow-y-auto pr-4 custom-scrollbar">
                        {sortedLogs.map((log: any, i: number) => (
                            <div key={i} className="grid grid-cols-5 gap-6 py-4 border-b border-gray-800/40 text-[11px] font-mono items-center hover:bg-red-500/5 px-4 rounded-xl transition-all">
                                <span className="text-gray-500">{new Date(Number(log.timestamp)*1000).toLocaleString()}</span>
                                <span className="truncate text-gray-400 font-bold">{log.officer}</span>
                                <span className={`text-[9px] font-black px-2 py-1 rounded border ${log.action === "VOTE_VALIDATE" ? "text-green-500 border-green-900/50 bg-green-950/50" : "text-blue-400 border-blue-900/50 bg-blue-950/50"}`}>{log.action}</span>
                                <span className="text-red-400/80 truncate italic">{log.officerLeaf}</span>
                                <span className="text-right text-white font-bold text-lg">#{log.reportId.toString()}</span>
                            </div>
                        ))}
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