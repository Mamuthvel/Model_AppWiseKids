import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AppBadge } from "./app-badge";
import { ScreenTimeChart } from "./screen-time-chart";
import { Clock, Smartphone, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Child, Alert, ChildApp, App } from "@shared/schema";

interface DashboardOverviewProps {
  selectedChildId: number;
}

export function DashboardOverview({ selectedChildId }: DashboardOverviewProps) {
  const { data: child } = useQuery({
    queryKey: ["/api/children", selectedChildId],
    enabled: !!selectedChildId,
  });

  const { data: childApps = [] } = useQuery({
    queryKey: ["/api/children", selectedChildId, "apps"],
    enabled: !!selectedChildId,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/children", selectedChildId, "settings"],
    enabled: !!selectedChildId,
  });

  const { data: todayScreenTime } = useQuery({
    queryKey: ["/api/children", selectedChildId, "screen-time"],
    enabled: !!selectedChildId,
  });

  // Calculate stats
  const totalScreenTimeToday = childApps.reduce((total, ca) => total + (ca.screenTimeToday || 0), 0);
  const screenTimeHours = Math.floor(totalScreenTimeToday / 60);
  const screenTimeMinutes = totalScreenTimeToday % 60;
  const screenTimeText = `${screenTimeHours}h ${screenTimeMinutes}m`;
  
  const dailyLimit = settings?.dailyScreenTimeLimit || 180;
  const screenTimeProgress = Math.min((totalScreenTimeToday / dailyLimit) * 100, 100);
  
  const recentAlerts = alerts.filter(alert => alert.childId === selectedChildId).slice(0, 3);
  const pendingAlerts = alerts.filter(alert => !alert.isRead && alert.childId === selectedChildId).length;

  const safetyBadgeCounts = childApps.reduce((counts, ca) => {
    const badge = ca.app.safetyBadge;
    counts[badge] = (counts[badge] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  if (!child) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Child Profile Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Child Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Child Info */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={child.profileImage || ""} />
                  <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{child.name}</p>
                  <p className="text-sm text-neutral-600">Age {child.age} • {child.deviceInfo}</p>
                </div>
              </div>
            </div>
            
            {/* Today's Screen Time */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock size={20} className="text-primary" />
                <div className="text-2xl font-bold text-primary">{screenTimeText}</div>
              </div>
              <p className="text-sm text-neutral-600">Today's Screen Time</p>
              <Progress value={screenTimeProgress} className="mt-2" />
              <p className="text-xs text-neutral-500 mt-1">
                Limit: {Math.floor(dailyLimit / 60)}h {dailyLimit % 60}m
              </p>
            </div>
            
            {/* Apps Installed */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Smartphone size={20} className="text-secondary" />
                <div className="text-2xl font-bold text-secondary">{childApps.length}</div>
              </div>
              <p className="text-sm text-neutral-600">Apps Installed</p>
              <div className="flex justify-center space-x-1 mt-2">
                {safetyBadgeCounts.safe > 0 && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title={`${safetyBadgeCounts.safe} safe apps`}></div>
                )}
                {safetyBadgeCounts.moderate > 0 && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" title={`${safetyBadgeCounts.moderate} moderate apps`}></div>
                )}
                {safetyBadgeCounts["high-risk"] > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title={`${safetyBadgeCounts["high-risk"]} high risk apps`}></div>
                )}
              </div>
            </div>
            
            {/* Pending Alerts */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle size={20} className="text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-500">{pendingAlerts}</div>
              </div>
              <p className="text-sm text-neutral-600">Pending Alerts</p>
              <Button variant="link" size="sm" className="text-xs text-primary hover:underline mt-1">
                View All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screen Time Chart */}
        <ScreenTimeChart childId={selectedChildId} />

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent alerts</p>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === "danger" ? "alert-danger" :
                    alert.severity === "warning" ? "alert-warning" : "alert-info"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === "danger" ? "bg-red-500" :
                      alert.severity === "warning" ? "bg-yellow-500" : "bg-blue-500"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-xs text-neutral-600 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <Button variant="outline" className="w-full mt-4">
              <Eye size={16} className="mr-2" />
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recently Installed Apps */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Installed Apps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childApps.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No apps installed yet</p>
              </div>
            ) : (
              childApps
                .sort((a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime())
                .slice(0, 6)
                .map((childApp) => (
                  <div
                    key={childApp.id}
                    className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <img
                      src={childApp.app.iconUrl || ""}
                      alt={childApp.app.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/48/f1f5f9/64748b?text=App";
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{childApp.app.name}</h4>
                        <AppBadge safetyLevel={childApp.app.safetyBadge as any} />
                      </div>
                      <p className="text-sm text-neutral-600">{childApp.app.category} • Age {childApp.app.ageRating}+</p>
                      <p className="text-xs text-neutral-500">
                        Installed {formatDistanceToNow(new Date(childApp.installedAt), { addSuffix: true })}
                      </p>
                      {childApp.isBlocked && (
                        <Badge variant="destructive" className="mt-1 text-xs">Blocked</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon">
                      <Eye size={16} />
                    </Button>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
