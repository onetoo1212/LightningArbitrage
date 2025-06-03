import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Download, Activity, Clock, Database, RefreshCw } from "lucide-react";

interface ExportAnalytics {
  exports24h: number;
  exportsWeekly: number;
  popularFormats: Record<string, number>;
  popularPlatforms: Record<string, number>;
  avgOpportunitiesPerExport: number;
  avgExecutionTimeMs: number;
  totalDataExported: number;
}

export default function ExportAnalytics() {
  const { data: analytics, isLoading, refetch } = useQuery<ExportAnalytics>({
    queryKey: ["/api/export/analytics"],
    refetchInterval: 30000
  });

  const formatChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key,
      value: value
    }));
  };

  const COLORS = ['#FFD700', '#00CED1', '#FF6347', '#32CD32', '#9370DB', '#FF69B4'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Export Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatData = formatChartData(analytics?.popularFormats || {});
  const platformData = formatChartData(analytics?.popularPlatforms || {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-accent-cyan" />
            <span>Export Analytics Dashboard</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-accent-yellow/10 to-accent-yellow/5 border-accent-yellow/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Exports Today</p>
                    <p className="text-2xl font-bold text-accent-yellow">
                      {analytics?.exports24h || 0}
                    </p>
                  </div>
                  <Download className="w-8 h-8 text-accent-yellow/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent-cyan/10 to-accent-cyan/5 border-accent-cyan/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Exports</p>
                    <p className="text-2xl font-bold text-accent-cyan">
                      {analytics?.exportsWeekly || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-accent-cyan/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Opportunities</p>
                    <p className="text-2xl font-bold text-green-400">
                      {analytics?.avgOpportunitiesPerExport || 0}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-green-400/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Speed</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics?.avgExecutionTimeMs || 0}ms
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-400/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="formats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formats">Export Formats</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="formats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Export Formats</CardTitle>
                </CardHeader>
                <CardContent>
                  {formatData.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formatData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px'
                            }} 
                          />
                          <Bar dataKey="value" fill="#FFD700" />
                        </BarChart>
                      </ResponsiveContainer>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={formatData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value}`}
                          >
                            {formatData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No export data available yet. Start exporting to see analytics.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="platforms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {platformData.length > 0 ? (
                    <div className="space-y-4">
                      {platformData.map((platform, index) => {
                        const total = platformData.reduce((sum, p) => sum + p.value, 0);
                        const percentage = Math.round((platform.value / total) * 100);
                        
                        return (
                          <div key={platform.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  style={{ borderColor: COLORS[index % COLORS.length] }}
                                >
                                  {platform.name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {platform.value} exports
                                </span>
                              </div>
                              <span className="text-sm font-medium">{percentage}%</span>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2"
                              style={{ 
                                backgroundColor: '#374151',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No platform usage data available yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium text-accent-yellow mb-2">Total Data Exported</h4>
                        <p className="text-2xl font-bold">
                          {(analytics?.totalDataExported || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">opportunities</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium text-accent-cyan mb-2">Average Export Size</h4>
                        <p className="text-2xl font-bold">
                          {analytics?.avgOpportunitiesPerExport || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">opportunities per export</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium text-green-400 mb-2">Processing Speed</h4>
                        <p className="text-2xl font-bold">
                          {analytics?.avgExecutionTimeMs || 0}ms
                        </p>
                        <p className="text-sm text-muted-foreground">average execution time</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium text-purple-400 mb-2">Export Efficiency</h4>
                        <p className="text-2xl font-bold">
                          {analytics?.avgExecutionTimeMs 
                            ? Math.round((analytics.avgOpportunitiesPerExport || 0) / (analytics.avgExecutionTimeMs / 1000))
                            : 0
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">opportunities/second</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}