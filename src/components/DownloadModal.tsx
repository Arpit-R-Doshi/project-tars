'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Key, Lock, Loader2 } from 'lucide-react';
import { verifyShards } from '../utils/security';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadAuthorized: (password: string) => void;
    isLoading: boolean;
}

export default function DownloadModal({ isOpen, onClose, onDownloadAuthorized, isLoading }: DownloadModalProps) {
    // Shards state for the modal only
    const [shards, setShards] = useState(['', '', '', '', '']);
    const [error, setError] = useState('');

    const masterKey = "TARS-ALPHA-SECURITY-OMEGA-PROTOCOL";

    const handleVerifyAndDownload = () => {
        setError('');
        if (shards.some(s => s.trim() === '')) {
            setError("All 5 fragments are required.");
            return;
        }

        if (verifyShards(shards)) {
            onDownloadAuthorized(masterKey); // Pass the final password to the parent
        } else {
            setError("Authentication Failed. Fragments incorrect.");
        }
    };

    const handleShardChange = (index: number, value: string) => {
        setError('');
        const newShards = [...shards];
        newShards[index] = value;
        setShards(newShards);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="glass-panel w-full max-w-lg p-8 rounded-3xl shadow-2xl space-y-6"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                >
                    <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <Lock size={24} />
                            <h3 className="text-xl font-black uppercase tracking-tighter">Secure Download Override</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed">
                        To maintain compliance, a new multi-factor authentication is required for hard copy generation. Input the 5 authorized key fragments.
                    </p>

                    <div className="grid grid-cols-5 gap-3">
                        {shards.map((shard, i) => (
                            <input
                                key={i}
                                type="password"
                                placeholder={`F${i + 1}`}
                                className="w-full bg-black border border-red-900/20 p-3 rounded-xl text-xs text-center font-mono outline-none focus:border-red-500"
                                value={shard}
                                onChange={(e) => handleShardChange(i, e.target.value)}
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-[10px] text-red-400 font-mono text-center bg-red-900/10 p-2 rounded-lg border border-red-900/30">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleVerifyAndDownload}
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                        {isLoading ? "GENERATING ENCRYPTED PDF" : "AUTHENTICATE & DOWNLOAD"}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}