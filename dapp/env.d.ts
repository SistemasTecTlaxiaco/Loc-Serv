/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SOROBAN_NETWORK: string;
  readonly PUBLIC_SOROBAN_RPC: string;
  readonly PUBLIC_CONTRACT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
