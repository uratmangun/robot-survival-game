"use client"
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

const neroChainTestnet = {
  id: 689,
  name: 'NERO Chain Testnet',
  iconUrl: '', // Optionally add a logo URL if available
  iconBackground: '#000',
  nativeCurrency: {
    name: 'NERO',
    symbol: 'NERO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.nerochain.io'] },
    public: { http: ['https://rpc-testnet.nerochain.io'] },
  },
  blockExplorers: {
    default: { name: 'NeroScan', url: 'https://testnet.neroscan.io' },
  },
  testnet: true
  // Optionally add multicall3 contract if available
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: 'YOUR_PROJECT_ID',
  chains: [neroChainTestnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
