import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { ScreenTimeData } from "@shared/schema";

interface ScreenTimeChartProps {
  childId: number;
}

export function ScreenTimeChart({ childId }: ScreenTimeChartProps) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
  const startDate = startOfWeek.toISOString().split('T')[0];

  const { data: screenTimeData, isLoading } = useQuery({
    queryKey: ["/api/children", childId, "screen-time", { startDate }],
    queryFn: async () => {
      const response = await fetch(`/api/children/${childId}/screen-time?startDate=${startDate}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch screen time data");
      return response.json() as ScreenTimeData[];
    },
    enabled: !!childId,
  });

  const chartData = useMemo(() => {
    if (!screenTimeData) return [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = screenTimeData.find(d => d.date === dateStr);
      
      data.push({
        day: dayNames[i],
        screenTime: dayData ? Math.round((dayData.totalMinutes / 60) * 10) / 10 : 0,
        fullDate: dateStr,
      });
    }

    return data;
  }, [screenTimeData, startOfWeek]);

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Screen Time Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Screen Time Analytics</CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" variant="default">Week</Button>
            <Button size="sm" variant="outline">Month</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(value) => `${value}h`}
              />
              <Bar 
                dataKey="screenTime" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
