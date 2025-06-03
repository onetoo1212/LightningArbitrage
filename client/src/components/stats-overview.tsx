import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowUpDown, Target, Fuel } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { StatsOverview } from "@shared/schema";

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<StatsOverview>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Profit (24h)</p>
              <p className="text-2xl font-bold text-profit">
                {stats ? formatCurrency(stats.totalProfit24h) : "$0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-profit/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-profit" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-profit mr-1" />
            <span className="text-profit">+12.5%</span>
            <span className="text-muted-foreground ml-2">vs yesterday</span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Active Opportunities</p>
              <p className="text-2xl font-bold text-accent-cyan">
                {stats?.activeOpportunities || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-cyan/20 rounded-xl flex items-center justify-center">
              <ArrowUpDown className="text-accent-cyan" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">Scanning</span>
            <span className="text-accent-yellow ml-2">
              {stats?.scannedPairs || 0} pairs
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {stats ? formatPercentage(stats.successRate) : "0%"}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-yellow/20 rounded-xl flex items-center justify-center">
              <Target className="text-accent-yellow" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">Last 100 trades</span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Gas Spent</p>
              <p className="text-2xl font-bold text-foreground">
                {stats ? formatCurrency(stats.gasSpent24h) : "$0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-loss/20 rounded-xl flex items-center justify-center">
              <Fuel className="text-loss" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-muted-foreground">Optimized routes</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
