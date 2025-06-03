import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Database, TrendingUp, Bot, BarChart3, Coins } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrageOpportunityWithDetails, TradingPlatformConfig } from "@shared/schema";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: ArbitrageOpportunityWithDetails[];
}

export default function ExportModal({ isOpen, onClose, opportunities }: ExportModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedOpportunities, setSelectedOpportunities] = useState<number[]>([]);
  const [exportAll, setExportAll] = useState(true);
  const { toast } = useToast();

  const { data: platforms = [] } = useQuery<TradingPlatformConfig[]>({
    queryKey: ["/api/trading-platforms"],
    enabled: isOpen,
  });

  const exportMutation = useMutation({
    mutationFn: async ({ format, platform, opportunityIds }: { 
      format: string; 
      platform: string; 
      opportunityIds?: number[] 
    }) => {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, platform, opportunityIds }),
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      // Handle file download
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
        title: "Export Successful",
        description: `Downloaded ${data.filename}`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Unable to export opportunities",
        variant: "destructive",
      });
    }
  });

  const selectedPlatformData = platforms.find(p => p.name === selectedPlatform);

  const handleExport = () => {
    if (!selectedFormat || !selectedPlatform) return;
    
    const opportunityIds = exportAll ? undefined : selectedOpportunities;
    exportMutation.mutate({
      format: selectedFormat,
      platform: selectedPlatform,
      opportunityIds
    });
  };

  const handleOpportunityToggle = (opportunityId: number) => {
    setSelectedOpportunities(prev => 
      prev.includes(opportunityId)
        ? prev.filter(id => id !== opportunityId)
        : [...prev, opportunityId]
    );
  };

  const getPlatformIcon = (name: string) => {
    switch (name) {
      case "TradingView": return <TrendingUp className="w-5 h-5" />;
      case "3Commas": return <Bot className="w-5 h-5" />;
      case "MetaTrader 5": return <BarChart3 className="w-5 h-5" />;
      case "Binance": return <Coins className="w-5 h-5" />;
      case "Generic CSV": return <FileText className="w-5 h-5" />;
      case "JSON Export": return <Database className="w-5 h-5" />;
      default: return <Download className="w-5 h-5" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case "csv": return "Spreadsheet-compatible format for manual analysis";
      case "json": return "Structured data format for API integrations";
      case "tradingview": return "TradingView-specific format for alerts and signals";
      case "3commas": return "3Commas bot configuration format";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Arbitrage Opportunities</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Select Trading Platform</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <Card 
                  key={platform.name}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlatform === platform.name 
                      ? "ring-2 ring-accent-yellow bg-accent-yellow/10" 
                      : "hover:bg-background/50"
                  }`}
                  onClick={() => setSelectedPlatform(platform.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(platform.name)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {platform.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {platform.supportedFormats.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          {selectedPlatformData && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Export Format</h3>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose export format" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlatformData.supportedFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      <div className="flex flex-col">
                        <span className="font-medium">{format.toUpperCase()}</span>
                        <span className="text-sm text-muted-foreground">
                          {getFormatDescription(format)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Opportunity Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Opportunities</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-all"
                  checked={exportAll}
                  onCheckedChange={(checked) => setExportAll(!!checked)}
                />
                <label htmlFor="export-all" className="text-sm">
                  Export all opportunities ({opportunities.length})
                </label>
              </div>
            </div>

            {!exportAll && (
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                {opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="flex items-center space-x-3 p-2 hover:bg-background/50 rounded-lg"
                  >
                    <Checkbox
                      checked={selectedOpportunities.includes(opportunity.id)}
                      onCheckedChange={() => handleOpportunityToggle(opportunity.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{opportunity.tradingPair.name}</span>
                        <Badge variant="outline" className="text-profit">
                          +{parseFloat(opportunity.profitMargin).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.exchangeA.name} → {opportunity.exchangeB.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-profit font-mono">
                        ${parseFloat(opportunity.estimatedProfit).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={!selectedFormat || !selectedPlatform || exportMutation.isPending}
              className="bg-accent-yellow hover:bg-accent-yellow/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}