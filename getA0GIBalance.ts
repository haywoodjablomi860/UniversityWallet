import { JsonRpcProvider, formatEther } from "ethers";

// RPC endpoint for the 0G Newton Testnet (Chain ID 16600)
const rpcUrl: string = "https://evmrpc-testnet.0g.ai";

// Replace with your wallet address
const walletAddress: string = "0xdcBC69d1684A49E88eac13465E6d160aBB5CbCC6";

// Create a JSON-RPC provider for the 0G Newton Testnet
const provider = new JsonRpcProvider(rpcUrl);

async function getA0GIBalance(): Promise<void> {
  try {
    // Fetch the balance in wei; the type is inferred automatically
    const balanceWei = await provider.getBalance(walletAddress);
    // Format the balance from wei to A0GI (assuming 18 decimals)
    const balanceA0GI: string = formatEther(balanceWei);
    console.log(`Balance of wallet ${walletAddress}: ${balanceA0GI} A0GI`);
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

getA0GIBalance();
