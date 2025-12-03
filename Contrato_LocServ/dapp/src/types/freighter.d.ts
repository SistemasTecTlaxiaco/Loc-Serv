// Type definitions for Freighter API
declare module '@stellar/freighter-api' {
  export function isConnected(): Promise<{ isConnected: boolean }>;
  export function requestAccess(): Promise<{ address: string }>;
  export function getAddress(): Promise<{ address: string }>;
  export function getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  export function signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string }
  ): Promise<{ signedTxXdr: string; signerAddress: string }>;
}
