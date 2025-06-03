import { 
  exchanges, 
  tradingPairs, 
  arbitrageOpportunities, 
  transactions, 
  botSettings,
  type Exchange, 
  type TradingPair, 
  type ArbitrageOpportunity,
  type ArbitrageOpportunityWithDetails,
  type Transaction, 
  type BotSettings,
  type InsertExchange, 
  type InsertTradingPair, 
  type InsertArbitrageOpportunity,
  type InsertTransaction, 
  type InsertBotSettings,
  type StatsOverview
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // Exchanges
  getAllExchanges(): Promise<Exchange[]>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  
  // Trading Pairs
  getAllTradingPairs(): Promise<TradingPair[]>;
  createTradingPair(pair: InsertTradingPair): Promise<TradingPair>;
  
  // Arbitrage Opportunities
  getArbitrageOpportunities(limit?: number): Promise<ArbitrageOpportunityWithDetails[]>;
  createArbitrageOpportunity(opportunity: InsertArbitrageOpportunity): Promise<ArbitrageOpportunity>;
  clearOldOpportunities(): Promise<void>;
  
  // Transactions
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Bot Settings
  getBotSettings(): Promise<BotSettings>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings>;
  
  // Statistics
  getStatsOverview(): Promise<StatsOverview>;
}

export class DatabaseStorage implements IStorage {
  async getAllExchanges(): Promise<Exchange[]> {
    const result = await db.select().from(exchanges).where(eq(exchanges.isActive, true));
    return result;
  }

  async createExchange(exchange: InsertExchange): Promise<Exchange> {
    const [result] = await db.insert(exchanges).values(exchange).returning();
    return result;
  }

  async getAllTradingPairs(): Promise<TradingPair[]> {
    const result = await db.select().from(tradingPairs).where(eq(tradingPairs.isActive, true));
    return result;
  }

  async createTradingPair(pair: InsertTradingPair): Promise<TradingPair> {
    const [result] = await db.insert(tradingPairs).values(pair).returning();
    return result;
  }

  async getArbitrageOpportunities(limit = 50): Promise<ArbitrageOpportunityWithDetails[]> {
    const opportunities = await db
      .select({
        id: arbitrageOpportunities.id,
        tradingPairId: arbitrageOpportunities.tradingPairId,
        exchangeAId: arbitrageOpportunities.exchangeAId,
        exchangeBId: arbitrageOpportunities.exchangeBId,
        priceA: arbitrageOpportunities.priceA,
        priceB: arbitrageOpportunities.priceB,
        profitMargin: arbitrageOpportunities.profitMargin,
        estimatedProfit: arbitrageOpportunities.estimatedProfit,
        gasEstimate: arbitrageOpportunities.gasEstimate,
        isExecutable: arbitrageOpportunities.isExecutable,
        createdAt: arbitrageOpportunities.createdAt,
        tradingPair: tradingPairs,
        exchangeA: {
          id: exchanges.id,
          name: exchanges.name,
          apiUrl: exchanges.apiUrl,
          isActive: exchanges.isActive,
        },
        exchangeB: {
          id: exchanges.id,
          name: exchanges.name,
          apiUrl: exchanges.apiUrl,
          isActive: exchanges.isActive,
        }
      })
      .from(arbitrageOpportunities)
      .leftJoin(tradingPairs, eq(arbitrageOpportunities.tradingPairId, tradingPairs.id))
      .leftJoin(exchanges, eq(arbitrageOpportunities.exchangeAId, exchanges.id))
      .orderBy(desc(arbitrageOpportunities.createdAt))
      .limit(limit);

    // Fix the join issue by querying separately for exchanges
    const result = await Promise.all(
      opportunities.map(async (opp) => {
        const [exchangeA] = await db.select().from(exchanges).where(eq(exchanges.id, opp.exchangeAId));
        const [exchangeB] = await db.select().from(exchanges).where(eq(exchanges.id, opp.exchangeBId));
        
        return {
          id: opp.id,
          tradingPairId: opp.tradingPairId,
          exchangeAId: opp.exchangeAId,
          exchangeBId: opp.exchangeBId,
          priceA: opp.priceA,
          priceB: opp.priceB,
          profitMargin: opp.profitMargin,
          estimatedProfit: opp.estimatedProfit,
          gasEstimate: opp.gasEstimate,
          isExecutable: opp.isExecutable,
          createdAt: opp.createdAt,
          tradingPair: opp.tradingPair!,
          exchangeA: exchangeA,
          exchangeB: exchangeB,
        };
      })
    );

    return result;
  }

  async createArbitrageOpportunity(opportunity: InsertArbitrageOpportunity): Promise<ArbitrageOpportunity> {
    const [result] = await db.insert(arbitrageOpportunities).values(opportunity).returning();
    return result;
  }

  async clearOldOpportunities(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await db.delete(arbitrageOpportunities).where(lt(arbitrageOpportunities.createdAt, oneHourAgo));
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.executedAt))
      .limit(limit);
    return result;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(transaction).returning();
    return result;
  }

  async getBotSettings(): Promise<BotSettings> {
    let [settings] = await db.select().from(botSettings).limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      [settings] = await db
        .insert(botSettings)
        .values({
          minProfitThreshold: "1.5",
          maxGasPrice: "50",
          tradeAmount: "1000",
          slippageTolerance: "0.5",
          autoExecuteEnabled: true,
          alertsEnabled: true,
        })
        .returning();
    }
    
    return settings;
  }

  async updateBotSettings(newSettings: Partial<InsertBotSettings>): Promise<BotSettings> {
    const [settings] = await db.select().from(botSettings).limit(1);
    
    if (settings) {
      const [updated] = await db
        .update(botSettings)
        .set({
          ...newSettings,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.id, settings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(botSettings)
        .values({
          minProfitThreshold: "1.5",
          maxGasPrice: "50",
          tradeAmount: "1000",
          slippageTolerance: "0.5",
          autoExecuteEnabled: true,
          alertsEnabled: true,
          ...newSettings,
        })
        .returning();
      return created;
    }
  }

  async getStatsOverview(): Promise<StatsOverview> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.status, 'success'), lt(transactions.executedAt, new Date())));
    
    const recentSuccessfulTransactions = recentTransactions.filter(
      tx => new Date(tx.executedAt) > oneDayAgo && tx.status === 'success'
    );
    
    const totalProfit24h = recentSuccessfulTransactions
      .filter(tx => tx.actualProfit)
      .reduce((sum, tx) => sum + parseFloat(tx.actualProfit!), 0);
    
    const gasSpent24h = recentTransactions
      .filter(tx => tx.gasUsed && new Date(tx.executedAt) > oneDayAgo)
      .reduce((sum, tx) => sum + parseFloat(tx.gasUsed!), 0);
    
    const recent24hTxs = recentTransactions.filter(tx => new Date(tx.executedAt) > oneDayAgo);
    const successfulTxs = recent24hTxs.filter(tx => tx.status === 'success').length;
    const successRate = recent24hTxs.length > 0 
      ? (successfulTxs / recent24hTxs.length) * 100 
      : 0;

    const activeOpportunities = await db.select().from(arbitrageOpportunities);
    const allPairs = await db.select().from(tradingPairs);

    return {
      totalProfit24h,
      activeOpportunities: activeOpportunities.length,
      successRate,
      gasSpent24h,
      scannedPairs: allPairs.length
    };
  }

  // Initialize default data
  async initializeDefaultData() {
    // Check if data already exists
    const existingExchanges = await db.select().from(exchanges).limit(1);
    if (existingExchanges.length > 0) {
      return; // Data already initialized
    }

    const defaultExchanges = [
      { name: "QuickSwap", apiUrl: "https://api.quickswap.exchange", isActive: true },
      { name: "SushiSwap", apiUrl: "https://api.sushi.com", isActive: true },
      { name: "Uniswap V3", apiUrl: "https://api.uniswap.org", isActive: true },
      { name: "Balancer", apiUrl: "https://api.balancer.fi", isActive: true },
      { name: "Curve", apiUrl: "https://api.curve.fi", isActive: true },
      { name: "1inch", apiUrl: "https://api.1inch.dev", isActive: true }
    ];

    await db.insert(exchanges).values(defaultExchanges);

    const defaultPairs = [
      { baseSymbol: "BTC", quoteSymbol: "USDC", name: "BTC/USDC", isActive: true },
      { baseSymbol: "ETH", quoteSymbol: "USDT", name: "ETH/USDT", isActive: true },
      { baseSymbol: "MATIC", quoteSymbol: "USDC", name: "MATIC/USDC", isActive: true },
      { baseSymbol: "WBTC", quoteSymbol: "ETH", name: "WBTC/ETH", isActive: true },
      { baseSymbol: "LINK", quoteSymbol: "ETH", name: "LINK/ETH", isActive: true }
    ];

    await db.insert(tradingPairs).values(defaultPairs);
  }
}

export const storage = new DatabaseStorage();
