import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Download, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";

const alertIcons = {
  high_risk: AlertTriangle,
  screen_time: Clock,
  app_install: Download,
  restriction: Shield,
};

const alertStyles = {
  danger: "alert-danger",
  warning: "alert-warning", 
  info: "alert-info",
};

export function AlertsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts"],
  }) as { data: Alert[]; isLoading: boolean };

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark alert as read");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread-count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark alert as read.",
        variant: "destructive",
      });
    },
  });

  const handleDismiss = (alertId: number) => {
    markAsReadMutation.mutate(alertId);
  };

  if (isLoading) {
    return <div>Loading alerts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notifications & Alerts</CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" variant="default">All</Button>
            <Button size="sm" variant="outline">High Priority</Button>
            <Button size="sm" variant="outline">Recent</Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alerts at this time</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = alertIcons[alert.type as keyof typeof alertIcons] || AlertTriangle;
              const alertStyle = alertStyles[alert.severity as keyof typeof alertStyles] || "alert-info";
              
              return (
                <div
                  key={alert.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${alertStyle} ${alert.isRead ? 'opacity-60' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    alert.severity === "danger" ? "bg-red-500" :
                    alert.severity === "warning" ? "bg-yellow-500" : "bg-blue-500"
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{alert.title}</h3>
                      <div className="flex items-center space-x-2">
                        {!alert.isRead && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                        <span className="text-xs text-neutral-500">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-600 mb-3">{alert.message}</p>
                    
                    <div className="flex space-x-2">
                      {alert.type === "high_risk" && (
                        <>
                          <Button size="sm" variant="destructive">
                            Keep Blocked
                          </Button>
                          <Button size="sm" variant="outline">
                            Review Details
                          </Button>
                        </>
                      )}
                      
                      {alert.type === "screen_time" && (
                        <>
                          <Button size="sm" variant="default">
                            Adjust Limits
                          </Button>
                          <Button size="sm" variant="outline">
                            View Usage
                          </Button>
                        </>
                      )}
                      
                      {alert.type === "app_install" && (
                        <>
                          <Button size="sm" variant="default">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Set Limits
                          </Button>
                        </>
                      )}
                      
                      {alert.type === "restriction" && (
                        <Button size="sm" variant="outline">
                          Remove Block
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDismiss(alert.id)}
                        disabled={markAsReadMutation.isPending || alert.isRead}
                      >
                        {alert.isRead ? "Dismissed" : "Dismiss"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alert Preferences */}
        <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Alert Preferences</h4>
              <p className="text-sm text-neutral-600">Customize when and how you receive notifications</p>
            </div>
            <Button variant="outline">
              Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
