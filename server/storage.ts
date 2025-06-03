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

export class MemStorage implements IStorage {
  private exchanges: Map<number, Exchange>;
  private tradingPairs: Map<number, TradingPair>;
  private arbitrageOpportunities: Map<number, ArbitrageOpportunity>;
  private transactions: Map<number, Transaction>;
  private botSettings: BotSettings;
  private currentId: number;

  constructor() {
    this.exchanges = new Map();
    this.tradingPairs = new Map();
    this.arbitrageOpportunities = new Map();
    this.transactions = new Map();
    this.currentId = 1;
    
    // Initialize bot settings
    this.botSettings = {
      id: 1,
      minProfitThreshold: "1.5",
      maxGasPrice: "50",
      tradeAmount: "1000",
      slippageTolerance: "0.5",
      autoExecuteEnabled: true,
      alertsEnabled: true,
      updatedAt: new Date()
    };

    // Initialize default exchanges
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultExchanges = [
      { name: "QuickSwap", apiUrl: "https://api.quickswap.exchange", isActive: true },
      { name: "SushiSwap", apiUrl: "https://api.sushi.com", isActive: true },
      { name: "Uniswap V3", apiUrl: "https://api.uniswap.org", isActive: true },
      { name: "Balancer", apiUrl: "https://api.balancer.fi", isActive: true },
      { name: "Curve", apiUrl: "https://api.curve.fi", isActive: true },
      { name: "1inch", apiUrl: "https://api.1inch.dev", isActive: true }
    ];

    defaultExchanges.forEach(exchange => {
      const id = this.currentId++;
      this.exchanges.set(id, { ...exchange, id });
    });

    const defaultPairs = [
      { baseSymbol: "BTC", quoteSymbol: "USDC", name: "BTC/USDC", isActive: true },
      { baseSymbol: "ETH", quoteSymbol: "USDT", name: "ETH/USDT", isActive: true },
      { baseSymbol: "MATIC", quoteSymbol: "USDC", name: "MATIC/USDC", isActive: true },
      { baseSymbol: "WBTC", quoteSymbol: "ETH", name: "WBTC/ETH", isActive: true },
      { baseSymbol: "LINK", quoteSymbol: "ETH", name: "LINK/ETH", isActive: true }
    ];

    defaultPairs.forEach(pair => {
      const id = this.currentId++;
      this.tradingPairs.set(id, { ...pair, id });
    });
  }

  async getAllExchanges(): Promise<Exchange[]> {
    return Array.from(this.exchanges.values()).filter(e => e.isActive);
  }

  async createExchange(exchange: InsertExchange): Promise<Exchange> {
    const id = this.currentId++;
    const newExchange = { ...exchange, id };
    this.exchanges.set(id, newExchange);
    return newExchange;
  }

  async getAllTradingPairs(): Promise<TradingPair[]> {
    return Array.from(this.tradingPairs.values()).filter(p => p.isActive);
  }

  async createTradingPair(pair: InsertTradingPair): Promise<TradingPair> {
    const id = this.currentId++;
    const newPair = { ...pair, id };
    this.tradingPairs.set(id, newPair);
    return newPair;
  }

  async getArbitrageOpportunities(limit = 50): Promise<ArbitrageOpportunityWithDetails[]> {
    const opportunities = Array.from(this.arbitrageOpportunities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return opportunities.map(opp => ({
      ...opp,
      tradingPair: this.tradingPairs.get(opp.tradingPairId)!,
      exchangeA: this.exchanges.get(opp.exchangeAId)!,
      exchangeB: this.exchanges.get(opp.exchangeBId)!
    }));
  }

  async createArbitrageOpportunity(opportunity: InsertArbitrageOpportunity): Promise<ArbitrageOpportunity> {
    const id = this.currentId++;
    const newOpportunity = { 
      ...opportunity, 
      id, 
      createdAt: new Date() 
    };
    this.arbitrageOpportunities.set(id, newOpportunity);
    return newOpportunity;
  }

  async clearOldOpportunities(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, opp] of this.arbitrageOpportunities.entries()) {
      if (new Date(opp.createdAt) < oneHourAgo) {
        this.arbitrageOpportunities.delete(id);
      }
    }
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const newTransaction = { 
      ...transaction, 
      id, 
      executedAt: new Date() 
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getBotSettings(): Promise<BotSettings> {
    return this.botSettings;
  }

  async updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings> {
    this.botSettings = {
      ...this.botSettings,
      ...settings,
      updatedAt: new Date()
    };
    return this.botSettings;
  }

  async getStatsOverview(): Promise<StatsOverview> {
    const transactions = await this.getRecentTransactions(1000);
    const opportunities = await this.getArbitrageOpportunities(1000);
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(tx => new Date(tx.executedAt) > oneDayAgo);
    
    const totalProfit24h = recentTransactions
      .filter(tx => tx.status === 'success' && tx.actualProfit)
      .reduce((sum, tx) => sum + parseFloat(tx.actualProfit!), 0);
    
    const gasSpent24h = recentTransactions
      .filter(tx => tx.gasUsed)
      .reduce((sum, tx) => sum + parseFloat(tx.gasUsed!), 0);
    
    const successfulTxs = recentTransactions.filter(tx => tx.status === 'success').length;
    const successRate = recentTransactions.length > 0 
      ? (successfulTxs / recentTransactions.length) * 100 
      : 0;

    return {
      totalProfit24h,
      activeOpportunities: opportunities.length,
      successRate,
      gasSpent24h,
      scannedPairs: this.tradingPairs.size
    };
  }
}

export const storage = new MemStorage();
