// storage.ts
import {
  User,
  InsertUser,
  Transaction,
  users,
  transactions,
  blockchain_addresses,
} from "@shared/schema";
import session from "express-session";
import { eq } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { onchain_transactions } from "@shared/schema";


const PostgresStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserBalance(userId: number, newBalance: string): Promise<User>;
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(senderId: number, receiverId: number, amount: string, type: string): Promise<Transaction>;
  getAllTransactions(): Promise<any[]>;
  createUserBlockchainAddress(userId: number, blockchainAddress: string): Promise<any>;
  getUserBlockchainAddress(userId: number): Promise<any>;
  updateUserBlockchainAddress(userId: number, newAddress: string): Promise<any>;
  promoteUserToAdmin(userId: number): Promise<User>;
  demoteUser(userId: number): Promise<User>;
  sessionStore: session.Store;
  markTransactionOnChain(transactionId: number, txHash: string): Promise<void>;

}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      isAdmin: insertUser.isAdmin || false,
      balance: "0",
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getTransactions(userId: number): Promise<any[]> {
    const sql = `
      SELECT 
        t.id, 
        t.amount, 
        t.timestamp, 
        t.type, 
        t.sender_id AS "senderId", 
        t.receiver_id AS "receiverId",
        s.full_name AS "senderName",
        r.full_name AS "receiverName"
      FROM transactions t
      LEFT JOIN users s ON t.sender_id = s.id
      LEFT JOIN users r ON t.receiver_id = r.id
      WHERE t.sender_id = ${userId} OR t.receiver_id = ${userId}
      ORDER BY t.timestamp DESC;
    `;
    const result = await db.execute(sql);
    return result.rows;
  }
  
  async createTransaction(
    senderId: number,
    receiverId: number,
    amount: string,
    type: string,
  ): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        senderId,
        receiverId,
        amount,
        type,
      })
      .returning();
    return transaction;
  }

  async getAllTransactions(): Promise<any[]> {
    const sql = `
      SELECT 
        t.id, 
        t.amount, 
        t.timestamp, 
        t.type, 
        t.sender_id AS "senderId", 
        t.receiver_id AS "receiverId",
        s.full_name AS "senderName", 
        r.full_name AS "receiverName"
      FROM transactions t
      LEFT JOIN users s ON t.sender_id = s.id
      LEFT JOIN users r ON t.receiver_id = r.id
      ORDER BY t.timestamp DESC;
    `;
    const result = await db.execute(sql);
    return result.rows;
  }

  async createUserBlockchainAddress(userId: number, blockchainAddress: string): Promise<any> {
    const [record] = await db.insert(blockchain_addresses).values({
      user_id: userId,
      block_address: blockchainAddress,
      created_at: new Date(),
    }).returning();
    return record;
  }

  async getUserBlockchainAddress(userId: number): Promise<any> {
    const [record] = await db.select().from(blockchain_addresses).where(eq(blockchain_addresses.user_id, userId));
    return record;
  }

  async updateUserBlockchainAddress(userId: number, newAddress: string): Promise<any> {
    const [record] = await db
      .update(blockchain_addresses)
      .set({ block_address: newAddress })
      .where(eq(blockchain_addresses.user_id, userId))
      .returning();
    return record;
  }

  // Promote a user to admin by updating their isAdmin flag to true
  async promoteUserToAdmin(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Demote an admin to a normal user by updating their isAdmin flag to false
  async demoteUser(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin: false })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }
  async markTransactionOnChain(transactionId: number, txHash: string): Promise<void> {
    await db.insert(onchain_transactions).values({
      transaction_id: transactionId,
      tx_hash: txHash,
      on_chain: true,
    });
  }
  
}

// Create default admin user after initializing storage
async function createAdminIfNotExists(storage: DatabaseStorage) {
  let admin = await storage.getUserByUsername("admin");
  if (!admin) {
    admin = await storage.createUser({
      username: "admin",
      password: "f033153a3b621fa192005a115a8f0251d51c318c30c7e98638af1f5b9618f3b8dd5955754b5b75c72f9e71a1b02e5b7822b2e9482d0f81b6d4c9295b0513dedc.1c3d94cf2f0b452adefa99625771e0de",
      email: "admin@university.edu",
      fullName: "System Administrator",
      department: "IT",
      isAdmin: true,
    });
  }

  // Check if the admin has a blockchain address; if not, assign one from the environment variable.
  const adminBlockchainAddress = await storage.getUserBlockchainAddress(admin.id);
  if (!adminBlockchainAddress) {
    const blockchainAddress = process.env.ADMIN_BLOCKCHAIN_ADDRESS;
    if (blockchainAddress) {
      await storage.createUserBlockchainAddress(admin.id, blockchainAddress);
    } else {
      console.error("ADMIN_BLOCKCHAIN_ADDRESS is not set in the environment variables.");
    }
  }
}





export const storage = new DatabaseStorage();
createAdminIfNotExists(storage).catch(console.error);
