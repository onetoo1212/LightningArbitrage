import { useQuery } from "@tanstack/react-query";
import { refreshArbitrageData } from "@/lib/api";
import type { ArbitrageOpportunityWithDetails, Transaction, StatsOverview } from "@shared/schema";

export function useArbitrageData() {
  const opportunitiesQuery = useQuery<ArbitrageOpportunityWithDetails[]>({
    queryKey: ["/api/opportunities"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 60000, // Refresh every minute
  });

  const statsQuery = useQuery<StatsOverview>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refetch = async () => {
    try {
      await refreshArbitrageData();
      await Promise.all([
        opportunitiesQuery.refetch(),
        transactionsQuery.refetch(),
        statsQuery.refetch()
      ]);
    } catch (error) {
      console.error("Failed to refresh arbitrage data:", error);
    }
  };

  return {
    opportunities: opportunitiesQuery.data || [],
    transactions: transactionsQuery.data || [],
    stats: statsQuery.data,
    isLoading: opportunitiesQuery.isLoading || transactionsQuery.isLoading || statsQuery.isLoading,
    refetch
  };
}
