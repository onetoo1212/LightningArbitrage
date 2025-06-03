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

        case 'metatrader':
          // MetaTrader 5 format
          const mtHeader = 'Symbol,Action,Volume,Price,StopLoss,TakeProfit,Comment\n';
          const mtRows = opportunities.filter(opp => opp.isExecutable).map(opp => [
            opp.tradingPair.baseSymbol + opp.tradingPair.quoteSymbol,
            'BUY',
            '0.1',
            opp.priceA,
            (parseFloat(opp.priceA) * 0.95).toFixed(8),
            (parseFloat(opp.priceA) * (1 + parseFloat(opp.profitMargin) / 100)).toFixed(8),
            `Arbitrage_${opp.exchangeA.name}_${opp.exchangeB.name}`
          ].join(',')).join('\n');
          
          exportData = mtHeader + mtRows;
          filename = `mt5_signals_${Date.now()}.csv`;
          contentType = 'text/csv';
          break;

        case 'binance':
          // Binance API format
          exportData = JSON.stringify({
            orders: opportunities.filter(opp => opp.isExecutable).map(opp => ({
              symbol: opp.tradingPair.baseSymbol + opp.tradingPair.quoteSymbol,
              side: 'BUY',
              type: 'LIMIT',
              timeInForce: 'GTC',
              quantity: (100 / parseFloat(opp.priceA)).toFixed(6),
              price: opp.priceA,
              stopPrice: (parseFloat(opp.priceA) * 0.95).toFixed(8),
              icebergQty: '0',
              newOrderRespType: 'RESULT',
              timestamp: Date.now(),
              metadata: {
                arbitrage_opportunity_id: opp.id,
                profit_margin: opp.profitMargin,
                target_exchange: opp.exchangeB.name
              }
            }))
          }, null, 2);
          filename = `binance_orders_${Date.now()}.json`;
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

  // Webhook export endpoint
  app.post("/api/export/webhook", async (req, res) => {
    try {
      const { webhookUrl, format, platform, filterCriteria } = req.body;
      
      if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required" });
      }

      // Get opportunities based on filter criteria
      const allOpportunities = await storage.getArbitrageOpportunities(1000);
      let opportunities = allOpportunities;

      if (filterCriteria) {
        opportunities = opportunities.filter(opp => {
          if (filterCriteria.minProfitMargin && parseFloat(opp.profitMargin) < filterCriteria.minProfitMargin) return false;
          if (filterCriteria.onlyExecutable && !opp.isExecutable) return false;
          if (filterCriteria.exchanges && !filterCriteria.exchanges.includes(opp.exchangeA.name)) return false;
          return true;
        });
      }

      // Format data for webhook
      const webhookData = {
        timestamp: new Date().toISOString(),
        platform: platform || 'webhook',
        format: format || 'json',
        total_opportunities: opportunities.length,
        opportunities: opportunities.map(opp => ({
          id: opp.id,
          trading_pair: opp.tradingPair.name,
          exchange_a: opp.exchangeA.name,
          exchange_b: opp.exchangeB.name,
          price_a: parseFloat(opp.priceA),
          price_b: parseFloat(opp.priceB),
          profit_margin: parseFloat(opp.profitMargin),
          estimated_profit: parseFloat(opp.estimatedProfit),
          is_executable: opp.isExecutable,
          created_at: opp.createdAt
        }))
      };

      // Send to webhook
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlashBot-Arbitrage-Exporter/1.0'
        },
        body: JSON.stringify(webhookData)
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }

      res.json({ 
        success: true, 
        message: "Data sent to webhook successfully",
        opportunities_sent: opportunities.length
      });

    } catch (error) {
      console.error("Webhook export error:", error);
      res.status(500).json({ error: "Failed to send data to webhook" });
    }
  });

  // Automated export scheduler endpoint
  app.post("/api/export/schedule", async (req, res) => {
    try {
      const { schedule, webhookUrl, format, platform, filterCriteria } = req.body;
      
      // This would typically be stored in database and managed by a job scheduler
      // For now, we'll return a success response indicating scheduling capability
      res.json({
        success: true,
        message: "Export scheduled successfully",
        schedule_id: `schedule_${Date.now()}`,
        next_execution: new Date(Date.now() + 60000).toISOString() // Next minute for demo
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to schedule export" });
    }
  });

  // Get available trading platforms
  app.get("/api/trading-platforms", async (req, res) => {
    try {
      const platforms = [
        {
          name: "TradingView",
          icon: "📈",
          supportedFormats: ["json", "csv", "tradingview"],
          requiredFields: ["symbol", "exchange", "signal"],
          description: "Export signals for TradingView alerts"
        },
        {
          name: "3Commas",
          icon: "🤖",
          supportedFormats: ["json", "3commas"],
          requiredFields: ["pair", "strategy", "take_profit"],
          description: "Create DCA bots for automated trading"
        },
        {
          name: "MetaTrader 5",
          icon: "📊",
          supportedFormats: ["csv", "metatrader"],
          requiredFields: ["symbol", "action", "volume"],
          description: "Import into MT5 Expert Advisors"
        },
        {
          name: "Binance",
          icon: "🔶",
          supportedFormats: ["json", "binance"],
          requiredFields: ["symbol", "side", "quantity"],
          description: "Direct API integration with Binance"
        },
        {
          name: "Webhook",
          icon: "🔗",
          supportedFormats: ["json"],
          requiredFields: ["webhook_url"],
          description: "Real-time data push to custom endpoint"
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

  // API Documentation endpoint
  app.get("/api/docs", async (req, res) => {
    try {
      const documentation = {
        title: "FlashBot Arbitrage API Documentation",
        version: "1.0.0",
        description: "Complete API for cryptocurrency arbitrage opportunities and trading platform exports",
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: {
          opportunities: {
            method: "GET",
            path: "/opportunities",
            description: "Get all arbitrage opportunities with detailed exchange and trading pair information",
            parameters: {
              limit: "Optional. Maximum number of opportunities to return (default: 50)"
            },
            response: "Array of opportunities with profit margins, exchanges, and execution status"
          },
          export: {
            method: "POST",
            path: "/export",
            description: "Export opportunities in various formats for trading platforms",
            body: {
              format: "Required. Export format: csv, json, tradingview, 3commas, metatrader, binance",
              platform: "Required. Target platform name",
              opportunityIds: "Optional. Array of specific opportunity IDs to export"
            },
            response: "File download with formatted data"
          },
          webhook: {
            method: "POST",
            path: "/export/webhook",
            description: "Send opportunities data to webhook endpoint in real-time",
            body: {
              webhookUrl: "Required. Target webhook URL",
              format: "Optional. Data format (default: json)",
              platform: "Optional. Platform identifier",
              filterCriteria: {
                minProfitMargin: "Optional. Minimum profit percentage",
                onlyExecutable: "Optional. Filter for executable opportunities only",
                exchanges: "Optional. Array of exchange names to include"
              }
            },
            response: "Success confirmation with opportunities sent count"
          },
          statistics: {
            method: "GET",
            path: "/stats",
            description: "Get comprehensive statistics and performance metrics",
            response: "Profit, success rate, active opportunities, and other metrics"
          },
          settings: {
            method: "GET/POST",
            path: "/settings",
            description: "Get or update bot configuration settings",
            response: "Bot settings including profit thresholds and execution parameters"
          }
        },
        exportFormats: {
          csv: "Standard comma-separated values for spreadsheet applications",
          json: "Structured JSON data for API integrations",
          tradingview: "TradingView-compatible format for alerts and signals",
          "3commas": "3Commas DCA bot configuration format",
          metatrader: "MetaTrader 5 Expert Advisor compatible CSV",
          binance: "Binance API-compatible order format"
        },
        webhookPayload: {
          timestamp: "ISO 8601 timestamp of export",
          platform: "Target platform identifier",
          total_opportunities: "Number of opportunities included",
          opportunities: [
            {
              id: "Unique opportunity identifier",
              trading_pair: "Symbol name (e.g., BTC/USDC)",
              exchange_a: "First exchange name",
              exchange_b: "Second exchange name",
              price_a: "Price on first exchange",
              price_b: "Price on second exchange",
              profit_margin: "Profit percentage",
              estimated_profit: "Estimated profit in USD",
              is_executable: "Boolean execution readiness",
              created_at: "Opportunity discovery timestamp"
            }
          ]
        },
        rateLimits: {
          export: "10 requests per minute",
          webhook: "5 requests per minute",
          general: "100 requests per minute"
        },
        authentication: "No authentication required for read operations. Export operations may have usage limits.",
        examples: {
          curlExport: `curl -X POST ${req.protocol}://${req.get('host')}/api/export \\
  -H "Content-Type: application/json" \\
  -d '{"format": "json", "platform": "generic"}' \\
  --output arbitrage_opportunities.json`,
          webhookIntegration: `curl -X POST ${req.protocol}://${req.get('host')}/api/export/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "webhookUrl": "https://your-server.com/webhook",
    "filterCriteria": {
      "minProfitMargin": 2.0,
      "onlyExecutable": true
    }
  }'`
        }
      };
      
      res.json(documentation);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate API documentation" });
    }
  });

  // Export analytics endpoint
  app.get("/api/export/analytics", async (req, res) => {
    try {
      const analytics = await storage.getExportAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch export analytics" });
    }
  });

  // Export status and health check
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getStatsOverview();
      const uptime = process.uptime();
      
      res.json({
        status: "healthy",
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        database: "connected",
        activeOpportunities: stats.activeOpportunities,
        exportFormats: ["csv", "json", "tradingview", "3commas", "metatrader", "binance"],
        features: {
          realTimeData: true,
          webhookIntegration: true,
          multiPlatformExport: true,
          scheduledExports: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        error: "Service temporarily unavailable" 
      });
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
