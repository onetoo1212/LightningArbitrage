import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, Play, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { ArbitrageOpportunityWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ExportModal from "@/components/export-modal";
import QuickExportButtons from "@/components/quick-export-buttons";

interface ArbitrageOpportunitiesProps {
  onRefresh: () => void;
}

export default function ArbitrageOpportunities({ onRefresh }: ArbitrageOpportunitiesProps) {
  const [filter, setFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();

  const { data: opportunities = [], isLoading, refetch } = useQuery<ArbitrageOpportunityWithDetails[]>({
    queryKey: ["/api/opportunities"],
  });

  const executeMutation = useMutation({
    mutationFn: async (opportunityId: number) => {
      const response = await fetch(`/api/execute/${opportunityId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to execute arbitrage');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Arbitrage Executed",
        description: "Trade executed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Execution Failed",
        description: "Failed to execute arbitrage trade",
        variant: "destructive",
      });
    }
  });

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === "high-profit") return parseFloat(opp.profitMargin) > 2;
    if (filter === "quick-execution") return opp.isExecutable;
    return true;
  });

  const handleRefresh = () => {
    refetch();
    onRefresh();
  };

  const handleExecute = (opportunityId: number) => {
    executeMutation.mutate(opportunityId);
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getCoinIcon = (symbol: string) => {
    const colors = {
      BTC: "from-orange-400 to-orange-600",
      ETH: "from-blue-400 to-purple-600", 
      MATIC: "from-purple-400 to-pink-600",
      WBTC: "from-orange-300 to-orange-500",
      LINK: "from-blue-300 to-blue-500"
    };
    return colors[symbol as keyof typeof colors] || "from-gray-400 to-gray-600";
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold">Live Arbitrage Opportunities</h2>
            <p className="text-muted-foreground text-sm">Real-time price differences across exchanges</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-background px-3 py-2 rounded-lg">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="border-0 bg-transparent p-0 h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pairs</SelectItem>
                  <SelectItem value="high-profit">High Profit (&gt;2%)</SelectItem>
                  <SelectItem value="quick-execution">Quick Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => setShowExportModal(true)}
              variant="outline"
              className="border-accent-cyan text-accent-cyan hover:bg-accent-cyan/10"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button 
              onClick={handleRefresh}
              className="bg-accent-yellow hover:bg-accent-yellow/90 text-primary-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trading Pair
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exchange A
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exchange B
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Potential Profit
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-8 bg-muted rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-muted rounded"></div>
                    </td>
                  </tr>
                ))
              ) : filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No arbitrage opportunities found
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-background/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-r ${getCoinIcon(opportunity.tradingPair.baseSymbol)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                          {opportunity.tradingPair.baseSymbol}
                        </div>
                        <div>
                          <div className="font-medium">{opportunity.tradingPair.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {opportunity.tradingPair.baseSymbol}/{opportunity.tradingPair.quoteSymbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono">{formatCurrency(opportunity.priceA)}</div>
                      <div className="text-muted-foreground text-sm">{opportunity.exchangeA.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono">{formatCurrency(opportunity.priceB)}</div>
                      <div className="text-muted-foreground text-sm">{opportunity.exchangeB.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-profit font-mono text-lg">
                          +{parseFloat(opportunity.profitMargin).toFixed(2)}%
                        </span>
                        <div className="w-2 h-2 bg-profit rounded-full animate-pulse-subtle"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-profit font-mono text-lg">
                        {formatCurrency(opportunity.estimatedProfit)}
                      </div>
                      <div className="text-muted-foreground text-sm">Est. profit</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button 
                        onClick={() => handleExecute(opportunity.id)}
                        disabled={executeMutation.isPending || !opportunity.isExecutable}
                        className="bg-profit hover:bg-profit/90 text-white"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Execute
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Quick Export Footer */}
        {filteredOpportunities.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-background/50">
            <QuickExportButtons opportunities={filteredOpportunities} />
          </div>
        )}
      </CardContent>
      
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        opportunities={filteredOpportunities}
      />
    </Card>
  );
}
