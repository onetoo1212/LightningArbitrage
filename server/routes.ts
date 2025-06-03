import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBotSettingsSchema, type PriceData } from "@shared/schema";
import { z } from "zod";

// CoinGecko API for cryptocurrency prices
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Mock exchange APIs - in production, these would be real exchange APIs
const EXCHANGE_APIS = {
  "QuickSwap": "quickswap",
  "SushiSwap": "sushiswap", 
  "Uniswap V3": "uniswap-v3",
  "Balancer": "balancer",
  "Curve": "curve",
  "1inch": "1inch"
};

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  };
}

async function fetchCryptoPrices(): Promise<PriceData[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,matic-network,wrapped-bitcoin,chainlink&vs_currencies=usd&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data: CoinGeckoPrice = await response.json();
    const prices: PriceData[] = [];
    
    const coinMapping = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH', 
      'matic-network': 'MATIC',
      'wrapped-bitcoin': 'WBTC',
      'chainlink': 'LINK'
    };
    
    const exchanges = await storage.getAllExchanges();
    
    // Generate price variations for different exchanges (simulate arbitrage opportunities)
    for (const [coinId, symbol] of Object.entries(coinMapping)) {
      if (data[coinId]) {
        const basePrice = data[coinId].usd;
        
        for (const exchange of exchanges) {
          // Add random variation (-2% to +2%) to simulate exchange price differences
          const variation = (Math.random() - 0.5) * 0.04; // -2% to +2%
          const price = basePrice * (1 + variation);
          
          prices.push({
            symbol,
            price,
            exchange: exchange.name,
            timestamp: Date.now()
          });
        }
      }
    }
    
    return prices;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    throw error;
  }
}

async function calculateArbitrageOpportunities() {
  try {
    const prices = await fetchCryptoPrices();
    const tradingPairs = await storage.getAllTradingPairs();
    const exchanges = await storage.getAllExchanges();
    
    // Clear old opportunities
    await storage.clearOldOpportunities();
    
    for (const pair of tradingPairs) {
      const pairPrices = prices.filter(p => p.symbol === pair.baseSymbol);
      
      // Find arbitrage opportunities between exchanges
      for (let i = 0; i < pairPrices.length; i++) {
        for (let j = i + 1; j < pairPrices.length; j++) {
          const priceA = pairPrices[i];
          const priceB = pairPrices[j];
          
          if (priceA.exchange !== priceB.exchange) {
            const priceDiff = Math.abs(priceA.price - priceB.price);
            const lowerPrice = Math.min(priceA.price, priceB.price);
            const profitMargin = (priceDiff / lowerPrice) * 100;
            
            // Only consider opportunities with significant profit margin
            if (profitMargin > 0.5) {
              const exchangeA = exchanges.find(e => e.name === priceA.exchange);
              const exchangeB = exchanges.find(e => e.name === priceB.exchange);
              
              if (exchangeA && exchangeB) {
                const tradeAmount = 1000; // $1000 default trade
                const estimatedProfit = (priceDiff / lowerPrice) * tradeAmount;
                const gasEstimate = Math.random() * 10 + 2; // $2-12 gas estimate
                
                await storage.createArbitrageOpportunity({
                  tradingPairId: pair.id,
                  exchangeAId: exchangeA.id,
                  exchangeBId: exchangeB.id,
                  priceA: priceA.price.toString(),
                  priceB: priceB.price.toString(),
                  profitMargin: profitMargin.toString(),
                  estimatedProfit: estimatedProfit.toString(),
                  gasEstimate: gasEstimate.toString(),
                  isExecutable: profitMargin > 1.5 && gasEstimate < estimatedProfit
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error calculating arbitrage opportunities:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all exchanges
  app.get("/api/exchanges", async (req, res) => {
    try {
      const exchanges = await storage.getAllExchanges();
      res.json(exchanges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchanges" });
    }
  });

  // Get all trading pairs
  app.get("/api/trading-pairs", async (req, res) => {
    try {
      const pairs = await storage.getAllTradingPairs();
      res.json(pairs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading pairs" });
    }
  });

  // Get arbitrage opportunities
  app.get("/api/opportunities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const opportunities = await storage.getArbitrageOpportunities(limit);
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch arbitrage opportunities" });
    }
  });

  // Get recent transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Get bot settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot settings" });
    }
  });

  // Update bot settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedSettings = insertBotSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateBotSettings(validatedSettings);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update bot settings" });
      }
    }
  });

  // Get statistics overview
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStatsOverview();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Execute arbitrage (mock implementation)
  app.post("/api/execute/:opportunityId", async (req, res) => {
    try {
      const opportunityId = parseInt(req.params.opportunityId);
      
      // Mock execution - in production this would interact with smart contracts
      const success = Math.random() > 0.1; // 90% success rate
      const actualProfit = success ? Math.random() * 100 + 20 : 0;
      const gasUsed = Math.random() * 10 + 2;
      
      const transaction = await storage.createTransaction({
        opportunityId,
        status: success ? 'success' : 'failed',
        txHash: success ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined,
        actualProfit: success ? actualProfit.toString() : undefined,
        gasUsed: gasUsed.toString()
      });
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute arbitrage" });
    }
  });

  // Refresh data endpoint
  app.post("/api/refresh", async (req, res) => {
    try {
      await calculateArbitrageOpportunities();
      res.json({ success: true, message: "Data refreshed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh data" });
    }
  });

  // Export opportunities endpoint
  app.post("/api/export", async (req, res) => {
    try {
      const { format, platform, opportunityIds } = req.body;
      
      let opportunities;
      if (opportunityIds && opportunityIds.length > 0) {
        // Export specific opportunities
        const allOpportunities = await storage.getArbitrageOpportunities(1000);
        opportunities = allOpportunities.filter(opp => opportunityIds.includes(opp.id));
      } else {
        // Export all opportunities
        opportunities = await storage.getArbitrageOpportunities(1000);
      }

      if (opportunities.length === 0) {
        return res.status(404).json({ error: "No opportunities found to export" });
      }

      let exportData;
      let filename;
      let contentType;

      switch (format) {
        case 'csv':
          const csvHeader = 'Trading Pair,Exchange A,Price A,Exchange B,Price B,Profit Margin,Estimated Profit,Gas Estimate,Created At\n';
          const csvRows = opportunities.map(opp => [
            opp.tradingPair.name,
            opp.exchangeA.name,
            opp.priceA,
            opp.exchangeB.name,
            opp.priceB,
            `${opp.profitMargin}%`,
            `$${opp.estimatedProfit}`,
            `$${opp.gasEstimate}`,
            new Date(opp.createdAt).toISOString()
          ].join(',')).join('\n');
          
          exportData = csvHeader + csvRows;
          filename = `arbitrage_opportunities_${Date.now()}.csv`;
          contentType = 'text/csv';
          break;

        case 'json':
          exportData = JSON.stringify({
            exported_at: new Date().toISOString(),
            platform: platform || 'generic',
            total_opportunities: opportunities.length,
            opportunities: opportunities.map(opp => ({
              id: opp.id,
              trading_pair: {
                symbol: opp.tradingPair.name,
                base: opp.tradingPair.baseSymbol,
                quote: opp.tradingPair.quoteSymbol
              },
              arbitrage: {
                exchange_a: {
                  name: opp.exchangeA.name,
                  price: parseFloat(opp.priceA)
                },
                exchange_b: {
                  name: opp.exchangeB.name,
                  price: parseFloat(opp.priceB)
                },
                profit_margin_percent: parseFloat(opp.profitMargin),
                estimated_profit_usd: parseFloat(opp.estimatedProfit),
                gas_estimate_usd: parseFloat(opp.gasEstimate),
                is_executable: opp.isExecutable
              },
              created_at: opp.createdAt,
              execution_ready: opp.isExecutable && parseFloat(opp.profitMargin) > 1.5
            }))
          }, null, 2);
          filename = `arbitrage_opportunities_${Date.now()}.json`;
          contentType = 'application/json';
          break;

        case 'tradingview':
          // TradingView-compatible format
          exportData = JSON.stringify({
            symbols: opportunities.map(opp => ({
              symbol: opp.tradingPair.baseSymbol + opp.tradingPair.quoteSymbol,
              exchange_a: opp.exchangeA.name,
              exchange_b: opp.exchangeB.name,
              price_diff: parseFloat(opp.priceA) - parseFloat(opp.priceB),
              profit_percentage: parseFloat(opp.profitMargin)
            }))
          }, null, 2);
          filename = `tradingview_signals_${Date.now()}.json`;
          contentType = 'application/json';
          break;

        case '3commas':
          // 3Commas DCA bot format
          exportData = JSON.stringify({
            bots: opportunities.filter(opp => opp.isExecutable).map(opp => ({
              name: `Arbitrage ${opp.tradingPair.name}`,
              pair: opp.tradingPair.baseSymbol + '_' + opp.tradingPair.quoteSymbol,
              strategy: 'arbitrage',
              base_order_volume: parseFloat(opp.estimatedProfit) * 10, // 10x profit as base volume
              take_profit: parseFloat(opp.profitMargin),
              max_active_deals: 1,
              exchanges: [opp.exchangeA.name, opp.exchangeB.name]
            }))
          }, null, 2);
          filename = `3commas_bots_${Date.now()}.json`;
          contentType = 'application/json';
          break;

        default:
          return res.status(400).json({ error: "Unsupported export format" });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);

    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export opportunities" });
    }
  });

  // Get available trading platforms
  app.get("/api/trading-platforms", async (req, res) => {
    try {
      const platforms = [
        {
          name: "TradingView",
          icon: "📈",
          supportedFormats: ["json", "csv"],
          requiredFields: ["symbol", "exchange", "signal"],
          description: "Export signals for TradingView alerts"
        },
        {
          name: "3Commas",
          icon: "🤖",
          supportedFormats: ["json"],
          requiredFields: ["pair", "strategy", "take_profit"],
          description: "Create DCA bots for automated trading"
        },
        {
          name: "MetaTrader 5",
          icon: "📊",
          supportedFormats: ["csv", "json"],
          requiredFields: ["symbol", "action", "volume"],
          description: "Import into MT5 Expert Advisors"
        },
        {
          name: "Binance",
          icon: "🔶",
          supportedFormats: ["json", "api"],
          requiredFields: ["symbol", "side", "quantity"],
          description: "Direct API integration with Binance"
        },
        {
          name: "Generic CSV",
          icon: "📄",
          supportedFormats: ["csv"],
          requiredFields: [],
          description: "Standard CSV format for any platform"
        },
        {
          name: "JSON Export",
          icon: "🔗",
          supportedFormats: ["json"],
          requiredFields: [],
          description: "Raw JSON data for custom integrations"
        }
      ];
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading platforms" });
    }
  });

  // Start background job to calculate opportunities every 30 seconds
  const interval = setInterval(calculateArbitrageOpportunities, 30000);
  
  // Initialize default data and start calculations
  await storage.initializeDefaultData();
  calculateArbitrageOpportunities();

  const httpServer = createServer(app);
  
  // Cleanup on server close
  httpServer.on('close', () => {
    clearInterval(interval);
  });

  return httpServer;
}
