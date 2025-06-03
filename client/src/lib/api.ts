export interface RefreshDataResponse {
  success: boolean;
  message: string;
}

export async function refreshArbitrageData(): Promise<RefreshDataResponse> {
  const response = await fetch("/api/refresh", {
    method: "POST",
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error("Failed to refresh data");
  }
  
  return response.json();
}

export async function executeArbitrage(opportunityId: number) {
  const response = await fetch(`/api/execute/${opportunityId}`, {
    method: "POST",
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error("Failed to execute arbitrage");
  }
  
  return response.json();
}
