import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Project TARS
        </h1>
        <p className="text-gray-400 max-w-lg">
          Secure Disclosure Network. Immutable. Anonymous.
        </p>
      </div>

      {/* The Wallet Connect Button */}
      <div className="border border-gray-800 p-4 rounded-xl bg-gray-900/50">
        <ConnectButton />
      </div>
    </main>
  );
}