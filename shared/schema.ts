// shared/schema.ts
import {
  pgTable,
  text,
  serial,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  balance: text("balance").notNull().default("0"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  amount: text("amount").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // 'transfer', 'withdrawal', or 'deposit'
});

export const blockchain_addresses = pgTable("blockchain_addresses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  block_address: text("block_address").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// ✅ NEW: Table to store on-chain transaction metadata
export const onchain_transactions = pgTable("onchain_transactions", {
  id: serial("id").primaryKey(),
  transaction_id: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  tx_hash: text("tx_hash").notNull(),
  on_chain: boolean("on_chain").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// ✅ Types and schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    fullName: true,
    department: true,
  })
  .extend({
    email: z.string().email().endsWith("@university.edu"),
  });

export const transferSchema = z.object({
  receiverId: z.number(),
  amount: z.string(),
});

export const withdrawalSchema = z.object({
  amount: z.string(),
});

// ✅ Export types for use in storage.ts and elsewhere
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type OnchainTransaction = typeof onchain_transactions.$inferSelect;
