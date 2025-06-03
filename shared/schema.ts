import {
  pgTable,
  text,
  serial,
  decimal,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiUrl: text("api_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const tradingPairs = pgTable("trading_pairs", {
  id: serial("id").primaryKey(),
  baseSymbol: text("base_symbol").notNull(),
  quoteSymbol: text("quote_symbol").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: serial("id").primaryKey(),
  tradingPairId: integer("trading_pair_id").notNull(),
  exchangeAId: integer("exchange_a_id").notNull(),
  exchangeBId: integer("exchange_b_id").notNull(),
  priceA: decimal("price_a", { precision: 18, scale: 8 }).notNull(),
  priceB: decimal("price_b", { precision: 18, scale: 8 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(),
  estimatedProfit: decimal("estimated_profit", {
    precision: 18,
    scale: 8,
  }).notNull(),
  gasEstimate: decimal("gas_estimate", { precision: 18, scale: 8 }).notNull(),
  isExecutable: boolean("is_executable").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull(),
  status: text("status").notNull(), // 'pending', 'success', 'failed'
  txHash: text("tx_hash"),
  actualProfit: decimal("actual_profit", { precision: 18, scale: 8 }),
  gasUsed: decimal("gas_used", { precision: 18, scale: 8 }),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  minProfitThreshold: decimal("min_profit_threshold", {
    precision: 5,
    scale: 2,
  })
    .default("1.5")
    .notNull(),
  maxGasPrice: decimal("max_gas_price", { precision: 10, scale: 2 })
    .default("50")
    .notNull(),
  tradeAmount: decimal("trade_amount", { precision: 18, scale: 8 })
    .default("1000")
    .notNull(),
  slippageTolerance: decimal("slippage_tolerance", { precision: 5, scale: 2 })
    .default("0.5")
    .notNull(),
  autoExecuteEnabled: boolean("auto_execute_enabled").default(true).notNull(),
  alertsEnabled: boolean("alerts_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExchangeSchema = createInsertSchema(exchanges).omit({
  id: true,
});
export const insertTradingPairSchema = createInsertSchema(tradingPairs).omit({
  id: true,
});
export const insertArbitrageOpportunitySchema = createInsertSchema(
  arbitrageOpportunities,
).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  executedAt: true,
});
export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export type Exchange = typeof exchanges.$inferSelect;
export type TradingPair = typeof tradingPairs.$inferSelect;
export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type BotSettings = typeof botSettings.$inferSelect;

export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type InsertTradingPair = z.infer<typeof insertTradingPairSchema>;
export type InsertArbitrageOpportunity = z.infer<
  typeof insertArbitrageOpportunitySchema
>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;

// Extended types for API responses
export interface ArbitrageOpportunityWithDetails extends ArbitrageOpportunity {
  tradingPair: TradingPair;
  exchangeA: Exchange;
  exchangeB: Exchange;
}

export interface PriceData {
  symbol: string;
  price: number;
  exchange: string;
  timestamp: number;
}

export interface StatsOverview {
  totalProfit24h: number;
  activeOpportunities: number;
  successRate: number;
  gasSpent24h: number;
  scannedPairs: number;
}

export interface ExportFormat {
  platform: string;
  format: 'csv' | 'json' | 'api' | 'webhook';
  data: any;
}

export interface TradingPlatformConfig {
  name: string;
  apiEndpoint?: string;
  requiredFields: string[];
  supportedFormats: string[];
  icon: string;
  description: string;
}
