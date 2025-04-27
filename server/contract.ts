// contract.ts
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import OrgTokenABI from "contract/token.json";
import dotenv from "dotenv";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);
const adminWallet = new Wallet(process.env.ADMIN_PRIVATE_KEY as string, provider);

const orgTokenContract = new Contract(
  process.env.CONTRACT_ADDRESS as string,
  OrgTokenABI,
  adminWallet
);

export default orgTokenContract;
