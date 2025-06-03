import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Settings as SettingsIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { BotSettings } from "@shared/schema";
import WebhookExport from "@/components/webhook-export";

export default function BotSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    minProfitThreshold: "1.5",
    maxGasPrice: "50",
    tradeAmount: "1000",
    slippageTolerance: "0.5",
    autoExecuteEnabled: true,
    alertsEnabled: true
  });
  const [showWebhookExport, setShowWebhookExport] = useState(false);

  const { data: botSettings } = useQuery<BotSettings>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Bot configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to save bot configuration",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (botSettings) {
      setSettings({
        minProfitThreshold: botSettings.minProfitThreshold,
        maxGasPrice: botSettings.maxGasPrice,
        tradeAmount: botSettings.tradeAmount,
        slippageTolerance: botSettings.slippageTolerance,
        autoExecuteEnabled: botSettings.autoExecuteEnabled,
        alertsEnabled: botSettings.alertsEnabled
      });
    }
  }, [botSettings]);

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [field]: checked }));
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">Bot Configuration & Export</h3>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4" />
              <span>Bot Settings</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Export & Webhooks</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minProfit">Min Profit Threshold</Label>
                <div className="relative">
                  <Input
                    id="minProfit"
                    type="number"
                    step="0.1"
                    value={settings.minProfitThreshold}
                    onChange={(e) => handleInputChange("minProfitThreshold", e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGas">Max Gas Price</Label>
                <div className="relative">
                  <Input
                    id="maxGas"
                    type="number"
                    step="0.1"
                    value={settings.maxGasPrice}
                    onChange={(e) => handleInputChange("maxGasPrice", e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">Gwei</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeAmount">Trade Amount</Label>
                <div className="relative">
                  <Input
                    id="tradeAmount"
                    type="number"
                    step="100"
                    value={settings.tradeAmount}
                    onChange={(e) => handleInputChange("tradeAmount", e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">USDC</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance</Label>
                <div className="relative">
                  <Input
                    id="slippage"
                    type="number"
                    step="0.1"
                    value={settings.slippageTolerance}
                    onChange={(e) => handleInputChange("slippageTolerance", e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-3 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoExecute"
                    checked={settings.autoExecuteEnabled}
                    onCheckedChange={(checked) => handleCheckboxChange("autoExecuteEnabled", !!checked)}
                  />
                  <Label htmlFor="autoExecute" className="text-sm">
                    Auto-execute profitable trades
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alerts"
                    checked={settings.alertsEnabled}
                    onCheckedChange={(checked) => handleCheckboxChange("alertsEnabled", !!checked)}
                  />
                  <Label htmlFor="alerts" className="text-sm">
                    Enable notifications
                  </Label>
                </div>
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-accent-yellow hover:bg-accent-yellow/90 text-primary-foreground"
              >
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="export">
            <WebhookExport onClose={() => setShowWebhookExport(false)} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
