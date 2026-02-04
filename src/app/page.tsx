'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, EyeOff, Database, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    { title: "Metadata Scrubbing", desc: "Automatic EXIF/GPS removal from all evidence.", icon: EyeOff },
    { title: "AES-256 Encryption", desc: "Client-side encryption ensures only authorities see data.", icon: ShieldCheck },
    { title: "Immutable IPFS", desc: "Evidence is sharded across decentralized storage.", icon: Database },
    { title: "AI Integrity Audit", desc: "Gemini-powered authenticity scoring on-chain.", icon: Zap },
  ];

  return (
    <main className="relative overflow-hidden pt-20 pb-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-900/20 to-transparent -z-10" />

      <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
            TRUSTLESS <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-600">
              INTEGRITY.
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Project TARS is a decentralized whistleblowing network. 
            We replace centralized trust with cryptographic certainty.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/submit" className="bg-white text-black px-8 py-4 rounded-full font-black text-lg hover:bg-blue-400 transition-colors">
              Submit Evidence
            </Link>
            <Link href="/admin" className="bg-gray-900 text-white border border-gray-800 px-8 py-4 rounded-full font-black text-lg hover:bg-gray-800 transition-colors">
              Authority Portal
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-4 gap-6 pt-20">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl text-left"
            >
              <f.icon className="text-blue-500 mb-4" size={32} />
              <h3 className="text-white font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}