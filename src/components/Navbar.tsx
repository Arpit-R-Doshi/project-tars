'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Upload, LayoutDashboard, Home, Activity } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Terminal', href: '/', icon: Home },
    { name: 'Submit Evidence', href: '/submit', icon: Upload },
    { name: 'Authority Portal', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="glass-header sticky top-0 z-50 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="bg-black border border-blue-500/30 p-2 rounded-xl relative z-10">
              <Shield className="text-blue-500 w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-white leading-none">TARS</span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Secure Network</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center bg-white/5 border border-white/5 rounded-full px-2 py-1.5 backdrop-blur-sm">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-green-500/80 bg-green-900/10 px-3 py-1.5 rounded-lg border border-green-900/20">
            <Activity size={12} className="animate-pulse" />
            SYSTEM ONLINE
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </nav>
  );
}