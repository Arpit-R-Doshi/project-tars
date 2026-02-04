'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Upload, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Submit', href: '/submit', icon: Upload },
    { name: 'Admin', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tighter text-white">TARS</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* REMOVED TrustScore component from here */}
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </nav>
  );
}