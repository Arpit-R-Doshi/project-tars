import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "../providers";
import Navbar from "../components/Navbar";
import { ShadowOverlay } from "../components/ShadowOverlay"; // <--- NEW IMPORT

// Primary Font (UI)
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

// Secondary Font (Data/Terminal)
const mono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TARS // Secure Disclosure Network",
  description: "Decentralized Forensic Whistleblowing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased selection:bg-blue-500/30">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
             
             {/* THE SHADER BACKGROUND (Fixed, Z-index -1 is handled inside component) */}
             <ShadowOverlay /> 
             
             <Navbar />
             <main className="flex-grow relative z-10">
               {children}
             </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}