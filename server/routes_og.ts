// // routes.ts
// import { parseUnits } from "ethers";
// import type { Express } from "express";
// import { createServer, type Server } from "http";
// import { setupAuth } from "./auth";
// import { storage } from "./storage";
// import { transferSchema, withdrawalSchema } from "@shared/schema";
// import orgTokenContract from "./contract";

// export async function registerRoutes(app: Express): Promise<Server> {
//   setupAuth(app);

//   // Get all users for role management (all users except the current user)
//   app.get("/api/users", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const users = await storage.getAllUsers();
//     // Return all users except the currently logged-in admin to prevent self-modification
//     res.json(users.filter(u => u.id !== req.user?.id));
//   });
  
//   // Get details for a single user by id
//   app.get("/api/user/:id", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
    
//     const id = parseInt(req.params.id);
//     const user = await storage.getUser(id);
//     if (!user) return res.status(404).json({ message: "User not found" });
    
//     res.json(user);
//   });

//   // Get user transactions
//   app.get("/api/transactions", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const transactions = await storage.getTransactions(req.user!.id);
//     res.json(transactions);
//   });

//   // Transfer funds (DB update only; blockchain transfer can be handled by standard ERC20 transfer from user wallets)
//   app.post("/api/transfer", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);

//     const result = transferSchema.safeParse(req.body);
//     if (!result.success) {
//       return res.status(400).json(result.error);
//     }

//     const { receiverId, amount } = result.data;
//     const sender = req.user!;
//     const receiver = await storage.getUser(receiverId);

//     if (!receiver) {
//       return res.status(404).json({ message: "Recipient not found" });
//     }

//     if (parseFloat(sender.balance) < parseFloat(amount)) {
//       return res.status(400).json({ message: "Insufficient funds" });
//     }

//     // Update balances in the DB
//     const newSenderBalance = (parseFloat(sender.balance) - parseFloat(amount)).toFixed(2);
//     const newReceiverBalance = (parseFloat(receiver.balance) + parseFloat(amount)).toFixed(2);

//     await storage.updateUserBalance(sender.id, newSenderBalance);
//     await storage.updateUserBalance(receiver.id, newReceiverBalance);

//     // Record transaction in the DB
//     const transaction = await storage.createTransaction(
//       sender.id,
//       receiver.id,
//       amount,
//       "transfer"
//     );

//     res.json(transaction);
//   });

//   // Withdraw funds (DB update only)
//   app.post("/api/withdraw", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);

//     const result = withdrawalSchema.safeParse(req.body);
//     if (!result.success) {
//       return res.status(400).json(result.error);
//     }

//     const { amount } = result.data;
//     const user = req.user!;

//     if (parseFloat(user.balance) < parseFloat(amount)) {
//       return res.status(400).json({ message: "Insufficient funds" });
//     }

//     // Update balance in the DB
//     const newBalance = (parseFloat(user.balance) - parseFloat(amount)).toFixed(2);
//     await storage.updateUserBalance(user.id, newBalance);

//     // Record withdrawal transaction in the DB
//     const transaction = await storage.createTransaction(
//       user.id,
//       user.id,
//       amount,
//       "withdrawal"
//     );

//     res.json(transaction);
//   });

//   // Get all transactions with sender and receiver names (admin-only)
//   app.get("/api/all-transactions", async (req, res) => {
//     if (!req.isAuthenticated()) return res.sendStatus(401);
//     const transactions = await storage.getAllTransactions();
//     res.json(transactions);
//   });

//   // In routes.ts
// app.post("/api/admin/master-balance", async (req, res) => {
//   if (!req.isAuthenticated() || !req.user?.isAdmin) {
//     return res.sendStatus(401);
//   }
  
//   const { userId, amount } = req.body;
//   if (!userId || typeof amount !== "string") {
//     return res.status(400).json({ message: "Invalid request" });
//   }
  
//   const user = await storage.getUser(userId);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }
  
//   // Update the user's DB balance
//   const currentBalance = parseFloat(user.balance);
//   const additionalFunds = parseFloat(amount);
//   const newBalance = (currentBalance + additionalFunds).toFixed(2);
//   const updatedUser = await storage.updateUserBalance(userId, newBalance);

//   // Record deposit transaction in the DB
//   const transaction = await storage.createTransaction(
//     userId,
//     userId,
//     amount,
//     "deposit"
//   );

//   // Retrieve the user's blockchain address from storage
//   const blockchainRecord = await storage.getUserBlockchainAddress(userId);
//   if (!blockchainRecord) {
//     return res.status(400).json({ message: "User does not have a blockchain address" });
//   }
//   const userBlockchainAddress = blockchainRecord.block_address;

//   // Convert amount to token units (assuming 18 decimals)
//   const tokenAmount = parseUnits(amount, 18);
//   try {
//     // Call the new mintTo function to mint tokens to the user's blockchain address
//     const mintTx = await orgTokenContract.mintTo(userBlockchainAddress, tokenAmount);
//     await mintTx.wait();
//     res.json({ updatedUser, transaction, mintTxHash: mintTx.hash });
//   } catch (err: any) {
//     res.status(500).json({ message: "Blockchain minting failed", error: err.message });
//   }
// });


//     // Admin: Promote a normal user to admin and update the blockchain mapping.
//     app.post("/api/admin/promote-user", async (req, res) => {
//       if (!req.isAuthenticated() || !req.user?.isAdmin) {
//         return res.sendStatus(401);
//       }
//       const { userId } = req.body;
//       if (!userId) {
//         return res.status(400).json({ message: "Invalid request" });
//       }
//       const user = await storage.getUser(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//       try {
//         // Update user role in the DB.
//         const updatedUser = await storage.promoteUserToAdmin(userId);
  
//         // Retrieve the user's blockchain address.
//         const blockchainRecord = await storage.getUserBlockchainAddress(userId);
//         if (!blockchainRecord) {
//           return res.status(400).json({ message: "User does not have a blockchain address" });
//         }
//         const userBlockchainAddress = blockchainRecord.block_address;
  
//         // Call the smart contract function to add the user as an admin on-chain.
//         const tx = await orgTokenContract.addAdmin(userBlockchainAddress);
//         await tx.wait();
  
//         res.json({ updatedUser, txHash: tx.hash });
//       } catch (err: any) {
//         res.status(500).json({ message: "Failed to promote user", error: err.message });
//       }
//     });
  
//     // Admin: Demote an admin to normal user and update the blockchain mapping.
//     app.post("/api/admin/demote-user", async (req, res) => {
//       if (!req.isAuthenticated() || !req.user?.isAdmin) {
//         return res.sendStatus(401);
//       }
//       const { userId } = req.body;
//       if (!userId) {
//         return res.status(400).json({ message: "Invalid request" });
//       }
//       const user = await storage.getUser(userId);
//       if (!user) {
//         return res.status(404).json({ message: "User not found" });
//       }
//       try {
//         // Update user role in the DB.
//         const updatedUser = await storage.demoteUser(userId);
  
//         // Retrieve the user's blockchain address.
//         const blockchainRecord = await storage.getUserBlockchainAddress(userId);
//         if (!blockchainRecord) {
//           return res.status(400).json({ message: "User does not have a blockchain address" });
//         }
//         const userBlockchainAddress = blockchainRecord.block_address;
  
//         // Call the smart contract function to remove the user from admins on-chain.
//         const tx = await orgTokenContract.removeAdmin(userBlockchainAddress);
//         await tx.wait();
  
//         res.json({ updatedUser, txHash: tx.hash });
//       } catch (err: any) {
//         res.status(500).json({ message: "Failed to demote user", error: err.message });
//       }
//     });

//   const httpServer = createServer(app);
//   return httpServer;
// }
