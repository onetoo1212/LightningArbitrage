import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Globe, Send, Clock, Settings } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface WebhookExportProps {
  onClose: () => void;
}

export default function WebhookExport({ onClose }: WebhookExportProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [minProfitMargin, setMinProfitMargin] = useState("2.0");
  const [onlyExecutable, setOnlyExecutable] = useState(true);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [schedule, setSchedule] = useState("manual");
  const { toast } = useToast();

  const exchanges = ["QuickSwap", "SushiSwap", "Uniswap V3", "Balancer", "Curve", "1inch"];

  const webhookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/export/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Webhook failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook Sent",
        description: `Successfully sent ${data.opportunities_sent} opportunities`,
      });
    },
    onError: () => {
      toast({
        title: "Webhook Failed",
        description: "Failed to send data to webhook endpoint",
        variant: "destructive",
      });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/export/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Schedule failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export Scheduled",
        description: `Next execution: ${new Date(data.next_execution).toLocaleTimeString()}`,
      });
    },
    onError: () => {
      toast({
        title: "Schedule Failed",
        description: "Failed to schedule automated export",
        variant: "destructive",
      });
    }
  });

  const handleSendNow = () => {
    if (!webhookUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }

    const filterCriteria = {
      minProfitMargin: parseFloat(minProfitMargin),
      onlyExecutable,
      exchanges: selectedExchanges.length > 0 ? selectedExchanges : undefined
    };

    webhookMutation.mutate({
      webhookUrl,
      format: "json",
      platform: "webhook",
      filterCriteria
    });
  };

  const handleSchedule = () => {
    if (!webhookUrl || schedule === "manual") {
      toast({
        title: "Configuration Required",
        description: "Please enter webhook URL and select schedule",
        variant: "destructive",
      });
      return;
    }

    const filterCriteria = {
      minProfitMargin: parseFloat(minProfitMargin),
      onlyExecutable,
      exchanges: selectedExchanges.length > 0 ? selectedExchanges : undefined
    };

    scheduleMutation.mutate({
      schedule,
      webhookUrl,
      format: "json",
      platform: "webhook",
      filterCriteria
    });
  };

  const handleExchangeToggle = (exchange: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchange)
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>Webhook Integration</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            placeholder="https://your-webhook-endpoint.com/arbitrage"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        {/* Filter Criteria */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Filter Criteria</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-profit">Minimum Profit Margin (%)</Label>
              <Input
                id="min-profit"
                type="number"
                step="0.1"
                value={minProfitMargin}
                onChange={(e) => setMinProfitMargin(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Only</SelectItem>
                  <SelectItem value="1min">Every Minute</SelectItem>
                  <SelectItem value="5min">Every 5 Minutes</SelectItem>
                  <SelectItem value="15min">Every 15 Minutes</SelectItem>
                  <SelectItem value="1hour">Every Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="executable-only"
              checked={onlyExecutable}
              onCheckedChange={(checked) => setOnlyExecutable(!!checked)}
            />
            <Label htmlFor="executable-only">Only executable opportunities</Label>
          </div>
        </div>

        {/* Exchange Selection */}
        <div className="space-y-3">
          <Label>Filter by Exchanges (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {exchanges.map((exchange) => (
              <Badge
                key={exchange}
                variant={selectedExchanges.includes(exchange) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleExchangeToggle(exchange)}
              >
                {exchange}
              </Badge>
            ))}
          </div>
          {selectedExchanges.length === 0 && (
            <p className="text-sm text-muted-foreground">All exchanges selected</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-3">
            <Button
              onClick={handleSendNow}
              disabled={webhookMutation.isPending}
              className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-foreground"
            >
              <Send className="w-4 h-4 mr-2" />
              {webhookMutation.isPending ? "Sending..." : "Send Now"}
            </Button>
            
            {schedule !== "manual" && (
              <Button
                onClick={handleSchedule}
                disabled={scheduleMutation.isPending}
                variant="outline"
                className="border-accent-yellow text-accent-yellow hover:bg-accent-yellow/10"
              >
                <Clock className="w-4 h-4 mr-2" />
                {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Webhook Format Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Webhook Payload Format
          </h4>
          <pre className="text-xs text-muted-foreground overflow-x-auto">
{`{
  "timestamp": "2024-01-01T12:00:00Z",
  "platform": "webhook",
  "total_opportunities": 5,
  "opportunities": [
    {
      "id": 123,
      "trading_pair": "BTC/USDC",
      "exchange_a": "QuickSwap",
      "exchange_b": "SushiSwap",
      "price_a": 45000.50,
      "price_b": 44950.25,
      "profit_margin": 2.1,
      "estimated_profit": 150.75,
      "is_executable": true,
      "created_at": "2024-01-01T11:59:30Z"
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}