declare module "@stellar/freighter-api" {
  export function isConnected(): Promise<boolean>;
  export function requestAccess(): Promise<{ address: string }>;
  export function getAddress(): Promise<string>;
}

