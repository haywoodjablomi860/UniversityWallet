// routes.ts
import { parseUnits } from "ethers";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { transferSchema, withdrawalSchema } from "@shared/schema";
import orgTokenContract from "./contract";
// Removed relayer import as we are not using meta-transactions now

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get all users for role management (all users except the current user)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    res.json(users.filter(u => u.id !== req.user?.id));
  });

  app.get("/api/user/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getTransactions(req.user!.id);
    res.json(transactions);
  });

  app.post("/api/transfer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
  
    const result = transferSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
  
    const { receiverId, amount } = result.data;
    const sender = req.user!;
    const receiver = await storage.getUser(receiverId);
  
    if (!receiver) return res.status(404).json({ message: "Recipient not found" });
  
    if (parseFloat(sender.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: "Insufficient funds" });
    }
  
    // Step 1: Update Off-chain balances
    const newSenderBalance = (parseFloat(sender.balance) - parseFloat(amount)).toFixed(2);
    const newReceiverBalance = (parseFloat(receiver.balance) + parseFloat(amount)).toFixed(2);
  
    await storage.updateUserBalance(sender.id, newSenderBalance);
    await storage.updateUserBalance(receiver.id, newReceiverBalance);
  
    const transaction = await storage.createTransaction(sender.id, receiver.id, amount, "transfer");
  
    res.json({ transaction }); // 🔄 Respond early
  
    // Step 2: Submit blockchain tx in background
    (async () => {
      try {
        const senderBlockchain = await storage.getUserBlockchainAddress(sender.id);
        const receiverBlockchain = await storage.getUserBlockchainAddress(receiver.id);
  
        if (!senderBlockchain || !receiverBlockchain) {
          console.error("Missing blockchain addresses for transfer");
          return;
        }
  
        const tokenAmount = parseUnits(amount, 18);
        const tx = await orgTokenContract.transferFromUserToUser(
          senderBlockchain.block_address,
          receiverBlockchain.block_address,
          tokenAmount
        );
        await tx.wait();
        
  
        await storage.markTransactionOnChain(transaction.id, tx.hash);
      } catch (err) {
        console.error("Blockchain transfer failed:", err);
      }
    })();
  });
  
  

  app.post("/api/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
  
    const result = withdrawalSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);
  
    const { amount } = result.data;
    const user = req.user!;
  
    if (parseFloat(user.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: "Insufficient funds" });
    }
  
    // Step 1: Off-chain balance deduction
    const newBalance = (parseFloat(user.balance) - parseFloat(amount)).toFixed(2);
    await storage.updateUserBalance(user.id, newBalance);
  
    const transaction = await storage.createTransaction(user.id, user.id, amount, "withdrawal");
  
    res.json({ transaction }); // 🔄 Respond early
  
    // Step 2: Fire blockchain burn in background
    (async () => {
      try {
        const blockchainRecord = await storage.getUserBlockchainAddress(user.id);
        if (!blockchainRecord) {
          console.error("Missing blockchain address for withdrawal");
          return;
        }
  
        const tokenAmount = parseUnits(amount, 18);
        const tx = await orgTokenContract.adminBurn(blockchainRecord.block_address, tokenAmount);
        await tx.wait();
  
        await storage.markTransactionOnChain(transaction.id, tx.hash);
      } catch (err) {
        console.error("Blockchain burn failed:", err);
      }
    })();
  });
  
  
  app.get("/api/all-transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getAllTransactions();
    res.json(transactions);
  });

  app.post("/api/admin/master-balance", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(401);
    
    const { userId, amount } = req.body;
    if (!userId || typeof amount !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentBalance = parseFloat(user.balance);
    const additionalFunds = parseFloat(amount);
    const newBalance = (currentBalance + additionalFunds).toFixed(2);
    const updatedUser = await storage.updateUserBalance(userId, newBalance);

    const transaction = await storage.createTransaction(userId, userId, amount, "deposit");

    const blockchainRecord = await storage.getUserBlockchainAddress(userId);
    if (!blockchainRecord) {
      return res.status(400).json({ message: "User does not have a blockchain address" });
    }

    const userBlockchainAddress = blockchainRecord.block_address;
    const tokenAmount = parseUnits(amount, 18);

    try {
      const mintTx = await orgTokenContract.mintTo(userBlockchainAddress, tokenAmount);
      await mintTx.wait();
      res.json({ updatedUser, transaction, mintTxHash: mintTx.hash });
    } catch (err: any) {
      res.status(500).json({ message: "Blockchain minting failed", error: err.message });
    }
  });

  app.post("/api/admin/promote-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(401);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Invalid request" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const updatedUser = await storage.promoteUserToAdmin(userId);
      const blockchainRecord = await storage.getUserBlockchainAddress(userId);
      if (!blockchainRecord) return res.status(400).json({ message: "User does not have a blockchain address" });

      const userBlockchainAddress = blockchainRecord.block_address;
      const tx = await orgTokenContract.addAdmin(userBlockchainAddress);
      await tx.wait();

      res.json({ updatedUser, txHash: tx.hash });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to promote user", error: err.message });
    }
  });

  app.post("/api/admin/demote-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(401);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Invalid request" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const updatedUser = await storage.demoteUser(userId);
      const blockchainRecord = await storage.getUserBlockchainAddress(userId);
      if (!blockchainRecord) return res.status(400).json({ message: "User does not have a blockchain address" });

      const userBlockchainAddress = blockchainRecord.block_address;
      const tx = await orgTokenContract.removeAdmin(userBlockchainAddress);
      await tx.wait();

      res.json({ updatedUser, txHash: tx.hash });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to demote user", error: err.message });
    }
  });

  // Updated: Admin On-Chain Transfer Tokens Endpoint using the admin function
  app.post("/api/admin/transfer-tokens", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(401);
    // Expecting 'from', 'to' and 'amount' in the request body
    const { from, to, amount } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ message: "Invalid request: missing 'from', 'to' or 'amount'" });
    }

    const tokenAmount = parseUnits(amount, 18);
    try {
      // Call the admin function transferFromUserToUser(from, to, tokenAmount)
      const tx = await orgTokenContract.transferFromUserToUser(from, to, tokenAmount);
      await tx.wait();
      res.json({ txHash: tx.hash });
    } catch (err: any) {
      res.status(500).json({ message: "Token transfer failed", error: err.message });
    }
  });

  // Updated: Admin On-Chain Burn Tokens Endpoint using adminBurn
  app.post("/api/admin/burn-tokens", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) return res.sendStatus(401);
    // Expecting 'from' and 'amount' in the request body
    const { from, amount } = req.body;
    if (!from || !amount) {
      return res.status(400).json({ message: "Invalid request: missing 'from' or 'amount'" });
    }

    const tokenAmount = parseUnits(amount, 18);
    try {
      const tx = await orgTokenContract.adminBurn(from, tokenAmount);
      await tx.wait();
      res.json({ txHash: tx.hash });
    } catch (err: any) {
      res.status(500).json({ message: "Token burn failed", error: err.message });
    }
  });

  // Removed: Meta Transaction Endpoint since we're not using relayers anymore

  const httpServer = createServer(app);
  return httpServer;
}
