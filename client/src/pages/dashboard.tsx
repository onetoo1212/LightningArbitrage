import { Zap, Network, Wallet } from "lucide-react";
import StatsOverview from "@/components/stats-overview";
import ArbitrageOpportunities from "@/components/arbitrage-opportunities";
import ProfitChart from "@/components/profit-chart";
import RecentTransactions from "@/components/recent-transactions";
import BotSettings from "@/components/bot-settings";
import { Button } from "@/components/ui/button";
import { useArbitrageData } from "@/hooks/use-arbitrage-data";
import { useState } from "react";

export default function Dashboard() {
  const [botActive, setBotActive] = useState(true);
  const { refetch } = useArbitrageData();

  const handleToggleBot = () => {
    setBotActive(!botActive);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-yellow rounded-lg flex items-center justify-center">
                  <Zap className="text-primary-foreground text-sm" />
                </div>
                <span className="text-xl font-bold">FlashBot</span>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
                <Network className="w-4 h-4 text-accent-cyan" />
                <span>Polygon Network</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-3 bg-background px-4 py-2 rounded-lg border border-border">
                <div className="w-2 h-2 bg-profit rounded-full animate-pulse-subtle"></div>
                <span className="text-sm text-muted-foreground">Wallet Connected</span>
                <span className="text-sm font-mono text-accent-cyan">0x58b6...F51E9</span>
              </div>
              
              <Button 
                onClick={handleToggleBot}
                className="bg-accent-yellow hover:bg-accent-yellow/90 text-primary-foreground"
              >
                <Zap className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {botActive ? "Bot Active" : "Bot Inactive"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <StatsOverview />
        <ArbitrageOpportunities onRefresh={handleRefresh} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfitChart />
          <RecentTransactions />
        </div>
        
        <BotSettings />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-profit rounded-full animate-pulse-subtle"></div>
                <span>Bot Status: {botActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Last update: 2s ago</span>
              </div>
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4" />
                <span>Network: Polygon Mainnet</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Profits auto-sent to: <span className="text-accent-cyan font-mono">0x58b6...F51E9</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
