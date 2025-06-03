import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const mockData = [
  { day: "Mon", profit: 845 },
  { day: "Tue", profit: 1162 },
  { day: "Wed", profit: 738 },
  { day: "Thu", profit: 1475 },
  { day: "Fri", profit: 1891 },
  { day: "Sat", profit: 1268 },
  { day: "Sun", profit: 1582 }
];

export default function ProfitChart() {
  const [period, setPeriod] = useState("7D");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Profit Trends</h3>
            <p className="text-muted-foreground text-sm">Last 7 days performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm"
              variant={period === "7D" ? "default" : "outline"}
              onClick={() => setPeriod("7D")}
              className={period === "7D" ? "bg-accent-yellow text-primary-foreground" : ""}
            >
              7D
            </Button>
            <Button 
              size="sm"
              variant={period === "30D" ? "default" : "outline"}
              onClick={() => setPeriod("30D")}
              className={period === "30D" ? "bg-accent-yellow text-primary-foreground" : ""}
            >
              30D
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value) => [`$${value}`, "Profit"]}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--profit-green))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--profit-green))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--profit-green))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
