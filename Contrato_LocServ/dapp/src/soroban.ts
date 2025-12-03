import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, signTransaction, getAddress } from '@stellar/freighter-api';

const { Contract, TransactionBuilder, Networks, rpc } = StellarSdk;

const CONTRACT_ID = (import.meta.env.VITE_CONTRACT_ID as string).trim();
const RPC_URL = (import.meta.env.VITE_RPC_URL as string).trim();

export const server = new rpc.Server(RPC_URL);

interface TransactionResult {
  hash: string;
  status: string;
  result?: any;
}

export async function invoke({ method, args = [], signAndSend = false }: { method: string, args?: any[], signAndSend?: boolean }): Promise<TransactionResult | any> {
  const connectedResponse = await isConnected();
  if (!connectedResponse.isConnected) {
    throw new Error("Freighter not connected");
  }

  const addressResponse = await getAddress();
  const publicKey = addressResponse.address;

  let sourceAccount;
  try {
    sourceAccount = await server.getAccount(publicKey);
  } catch (e: any) {
    if (e.message && e.message.includes('404')) {
      throw new Error("Tu cuenta no existe en Testnet. Por favor usa el Friendbot de Stellar para fondearla primero.");
    }
    throw e;
  }

  const contract = new Contract(CONTRACT_ID);

  // Build the transaction
  let tx = new TransactionBuilder(sourceAccount, {
    fee: '100000', // Increased fee for contract invocations
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  if (signAndSend) {
    // First, simulate the transaction to prepare it
    console.log('Simulating transaction...');
    const simulationResponse = await server.simulateTransaction(tx);

    console.log('Simulation response:', simulationResponse);

    // Check if simulation was successful
    if (StellarSdk.rpc.Api.isSimulationSuccess(simulationResponse)) {
      // Prepare the transaction with the simulation results
      const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simulationResponse).build();

      console.log('Transaction prepared, requesting signature...');

      // Sign the transaction
      const signResponse = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: Networks.TESTNET,
      });

      const signedTx = TransactionBuilder.fromXDR(signResponse.signedTxXdr, Networks.TESTNET);

      // Get the hash from the signed transaction (this is the correct hash)
      const txHash = signedTx.hash().toString('hex');

      console.log('Transaction hash:', txHash);
      console.log('Sending transaction to network...');

      const sendResponse = await server.sendTransaction(signedTx);

      console.log('Transaction sent:', sendResponse);

      // Wait for confirmation
      if (sendResponse.status === 'PENDING') {
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max

        console.log('Waiting for confirmation...');

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            const getResponse = await server.getTransaction(txHash);

            if (getResponse.status === 'SUCCESS') {
              console.log('✅ Transaction confirmed:', getResponse);
              return {
                hash: txHash,
                status: 'SUCCESS',
                result: getResponse
              };
            } else if (getResponse.status === 'FAILED') {
              console.error('❌ Transaction failed:', getResponse);
              throw new Error('Transaction failed on blockchain');
            }
          } catch (e) {
            // Transaction not found yet, continue waiting
          }

          attempts++;
        }

        // Timeout
        console.warn('⏱️ Transaction timeout');
        return {
          hash: txHash,
          status: 'TIMEOUT',
          result: null
        };
      }

      return {
        hash: txHash,
        status: sendResponse.status,
        result: sendResponse
      };
    } else {
      // Simulation failed
      console.error('Simulation failed:', simulationResponse);
      throw new Error(`Simulation failed: ${JSON.stringify(simulationResponse)}`);
    }
  }

  return server.simulateTransaction(tx);
}
