'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, EyeOff, Database, Zap, Lock, ChevronRight } from 'lucide-react';

export default function Home() {
  const features = [
    { title: "Zero-Trace Privacy", desc: "Metadata is scrubbed via Canvas API. No GPS or device headers survive the wash.", icon: EyeOff },
    { title: "AES-256 Encryption", desc: "Military-grade client-side encryption before data ever leaves your device.", icon: Lock },
    { title: "Immutable Storage", desc: "Evidence is sharded and pinned to IPFS via Pinata. Censorship resistant.", icon: Database },
    { title: "AI Forensics", desc: "Neural audit by Gemini 1.5 & Bitmind Protocol detects deepfakes instantly.", icon: Zap },
  ];

  return (
    <main className="relative pt-20 pb-32 px-6">
      
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Project TARS v2.0 Live on Polygon Amoy
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
            TRUSTLESS<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient bg-300%">INTEGRITY.</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            The world's first <span className="text-white font-semibold">Decentralized Whistleblowing Protocol</span>. 
            Replacing centralized trust with cryptographic certainty and AI forensics.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <Link href="/submit" className="group relative px-8 py-4 bg-white text-black rounded-full font-black text-sm uppercase tracking-widest overflow-hidden">
            <div className="absolute inset-0 bg-blue-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative group-hover:text-white transition-colors flex items-center gap-2">
              Submit Evidence <ChevronRight size={16} />
            </span>
          </Link>
          
          <Link href="/admin" className="group px-8 py-4 bg-black border border-gray-800 text-gray-300 rounded-full font-black text-sm uppercase tracking-widest hover:border-gray-600 hover:text-white transition-all flex items-center gap-2">
            Authority Portal <Lock size={14} className="group-hover:text-blue-500 transition-colors" />
          </Link>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32">
        {features.map((f, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-3xl hover:border-blue-500/30 transition-all group"
          >
            <div className="w-12 h-12 bg-black border border-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:border-blue-500/50">
              <f.icon className="text-gray-400 group-hover:text-blue-400 transition-colors" size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-3 font-mono">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Footer / Status */}
      <div className="max-w-6xl mx-auto mt-32 border-t border-gray-900 pt-8 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
        <div>System Status: Nominal</div>
        <div>Encrypted via AES-256</div>
      </div>
    </main>
  );
}