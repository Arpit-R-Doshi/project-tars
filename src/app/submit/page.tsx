'use client';
import TrustScore from '../../components/TrustScore';
import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { stripMetadata, encryptFile } from '../../utils/security';
import { uploadToIPFS } from '../../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Lock, FileWarning } from 'lucide-react';

export default function SubmitPage() {
  const { isConnected } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Wagmi Hook to write to blockchain
  const { writeContract } = useWriteContract();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatus('Stripping Metadata...');

    try {
      const cleanFile = await stripMetadata(file);
      
      const SIMULATED_KEY = "tars-hackathon-secret-key"; 
      setStatus('Encrypting Data...');
      const encryptedBlob = await encryptFile(cleanFile, SIMULATED_KEY);

      setStatus('Uploading to IPFS...');
      const cid = await uploadToIPFS(encryptedBlob);

      // --- NEW GUARD ---
      if (!cid || cid.length < 10) {
        throw new Error("Invalid CID generated. Check your Pinata API Key.");
      }

      setStatus('Signing Transaction...');
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitReport',
        args: [cid], // This CID is now verified
      }, {
        onSuccess: () => {
            setStatus('Report Submitted! CID: ' + cid);
            setIsUploading(false);
            setFile(null);
        },
        onError: (error) => {
            setStatus('Contract Error: ' + error.message);
            setIsUploading(false);
        }
      });

    } catch (error: any) {
      console.error(error);
      setStatus('System Error: ' + error.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-10">
      <div className="w-full max-w-2xl space-y-8">
        
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
  <h1 className="text-3xl font-bold bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
    Secure Submission
  </h1>
  <div className="flex items-center gap-4">
    <TrustScore />
    <ConnectButton />
  </div>
</header>

        {!isConnected ? (
          <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800">
            <Lock className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold">Wallet Connection Required</h2>
            <p className="text-gray-400 mt-2">Connect your wallet to establish a secure, anonymous channel.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div className="bg-gray-900/50 p-8 rounded-xl border border-gray-700 border-dashed text-center hover:bg-gray-900/80 transition cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileWarning className="w-12 h-12 mx-auto text-blue-500 mb-4" />
              <p className="text-lg font-medium">
                {file ? file.name : "Drop Evidence Here"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Images are automatically scrubbed of EXIF/GPS data before encryption.
              </p>
            </div>

            {/* Status Indicator */}
            {status && (
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center gap-3 text-blue-400">
                 {isUploading ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                 <span>{status}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                !file || isUploading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/20'
              }`}
            >
              {isUploading ? 'Processing Protocol...' : 'Submit to TARS Network'}
            </button>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}