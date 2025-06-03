import { Button } from "@/components/ui/button";
import { Download, FileText, Database, TrendingUp, Bot } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrageOpportunityWithDetails } from "@shared/schema";

interface QuickExportButtonsProps {
  opportunities: ArbitrageOpportunityWithDetails[];
  className?: string;
}

export default function QuickExportButtons({ opportunities, className = "" }: QuickExportButtonsProps) {
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async ({ format, platform }: { format: string; platform: string }) => {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, platform }),
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export_${Date.now()}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { filename };
    },
    onSuccess: (data) => {
      toast({
        title: "Export Complete",
        description: `Downloaded ${data.filename}`,
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Unable to export opportunities",
        variant: "destructive",
      });
    }
  });

  const handleQuickExport = (format: string, platform: string) => {
    exportMutation.mutate({ format, platform });
  };

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Quick export:</span>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickExport("csv", "Generic CSV")}
        disabled={exportMutation.isPending}
        className="h-8"
      >
        <FileText className="w-3 h-3 mr-1" />
        CSV
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickExport("json", "JSON Export")}
        disabled={exportMutation.isPending}
        className="h-8"
      >
        <Database className="w-3 h-3 mr-1" />
        JSON
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickExport("tradingview", "TradingView")}
        disabled={exportMutation.isPending}
        className="h-8"
      >
        <TrendingUp className="w-3 h-3 mr-1" />
        TV
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleQuickExport("3commas", "3Commas")}
        disabled={exportMutation.isPending}
        className="h-8"
      >
        <Bot className="w-3 h-3 mr-1" />
        3C
      </Button>
    </div>
  );
}