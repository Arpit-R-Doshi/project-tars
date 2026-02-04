'use client';

import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';

export default function TrustScore() {
  const { address, isConnected } = useAccount();

  const { data: score } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTrustScore',
    args: address ? [address] : undefined,
  });

  if (!isConnected) return null;

  // Convert BigInt to Number
  const displayScore = score ? Number(score) : 50;

  return (
    <div className="flex items-center gap-4 bg-gray-900/80 border border-gray-800 px-4 py-2 rounded-full shadow-inner">
      <Shield className={`w-5 h-5 ${displayScore >= 50 ? 'text-green-400' : 'text-red-400'}`} />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-gray-500 font-bold leading-none">Trust Score</span>
        <span className="text-sm font-mono font-bold text-white leading-tight">
          {displayScore}/100
        </span>
      </div>
      {displayScore > 50 ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : displayScore < 50 ? (
        <TrendingDown className="w-4 h-4 text-red-500" />
      ) : null}
    </div>
  );
}