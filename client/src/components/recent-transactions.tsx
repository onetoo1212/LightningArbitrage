import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@shared/schema";

export default function RecentTransactions() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return "$0";
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <p className="text-muted-foreground text-sm">Latest arbitrage executions</p>
          </div>
          <Button variant="link" className="text-accent-cyan hover:text-accent-cyan/80 p-0">
            View All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-16 bg-muted rounded mt-1"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-3 w-16 bg-muted rounded mt-1"></div>
              </div>
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent transactions
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  transaction.status === 'success' ? 'bg-profit' : 'bg-loss'
                }`}></div>
                <div>
                  <div className="font-medium">
                    Arbitrage Trade #{transaction.id}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {formatTimeAgo(transaction.executedAt)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono ${
                  transaction.status === 'success' ? 'text-profit' : 'text-loss'
                }`}>
                  {transaction.status === 'success' ? '+' : '-'}
                  {formatCurrency(transaction.actualProfit || transaction.gasUsed)}
                </div>
                <div className="text-muted-foreground text-sm">
                  Gas: {formatCurrency(transaction.gasUsed)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
