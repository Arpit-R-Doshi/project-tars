'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  polygonAmoy,
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

const { wallets } = getDefaultWallets();

/* 
   IMPORTANT: 
   For a production app, get a Project ID from https://cloud.reown.com/ (formerly WalletConnect).
   For this hackathon build, you can use a placeholder string, but console might warn you.
*/
const config = getDefaultConfig({
  appName: 'Project TARS',
  projectId: 'YOUR_PROJECT_ID_HERE', // Replace with real ID if you have one
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [
    polygonAmoy, // We are strictly using Polygon Amoy Testnet
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}