import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppBadge } from "./app-badge";
import { Settings, Eye, Ban, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { ChildApp, App } from "@shared/schema";

interface AppsViewProps {
  selectedChildId: number;
}

export function AppsView({ selectedChildId }: AppsViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const { data: childApps = [], isLoading } = useQuery({
    queryKey: ["/api/children", selectedChildId, "apps"],
    enabled: !!selectedChildId,
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ appId, updates }: { appId: number; updates: Partial<ChildApp> }) => {
      const response = await fetch(`/api/children/${selectedChildId}/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to update app");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChildId, "apps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "App updated",
        description: "App settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update app settings.",
        variant: "destructive",
      });
    },
  });

  // Filter apps based on selected filters
  const filteredApps = childApps.filter((childApp) => {
    const categoryMatch = categoryFilter === "all" || childApp.app.category.toLowerCase() === categoryFilter.toLowerCase();
    const riskMatch = riskFilter === "all" || childApp.app.safetyBadge === riskFilter;
    return categoryMatch && riskMatch;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(childApps.map(ca => ca.app.category)));

  const handleToggleBlock = (appId: number, currentlyBlocked: boolean) => {
    updateAppMutation.mutate({
      appId,
      updates: { isBlocked: !currentlyBlocked },
    });
  };

  if (isLoading) {
    return <div>Loading apps...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle>App Management</CardTitle>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredApps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {childApps.length === 0 ? "No apps installed yet" : "No apps match the selected filters"}
              </p>
            </div>
          ) : (
            filteredApps.map((childApp) => (
              <div
                key={childApp.id}
                className="flex items-center space-x-4 p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <img
                  src={childApp.app.iconUrl || ""}
                  alt={childApp.app.name}
                  className="w-16 h-16 rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/64/f1f5f9/64748b?text=App";
                  }}
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{childApp.app.name}</h3>
                    <AppBadge safetyLevel={childApp.app.safetyBadge as any} />
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">{childApp.app.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-neutral-500">
                    <span>Age {childApp.app.ageRating}+</span>
                    <span>•</span>
                    <span>{childApp.app.category}</span>
                    <span>•</span>
                    {childApp.isBlocked ? (
                      <span className="text-red-600 font-medium">Currently Blocked</span>
                    ) : (
                      <span>Screen time: {Math.floor((childApp.screenTimeToday || 0) / 60)}h {(childApp.screenTimeToday || 0) % 60}m today</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Installed {formatDistanceToNow(new Date(childApp.installedAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    variant={childApp.isBlocked ? "default" : "destructive"}
                    onClick={() => handleToggleBlock(childApp.appId, childApp.isBlocked)}
                    disabled={updateAppMutation.isPending}
                    className="min-w-24"
                  >
                    {childApp.isBlocked ? (
                      <>
                        <Eye size={14} className="mr-1" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <Ban size={14} className="mr-1" />
                        Block
                      </>
                    )}
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <Settings size={14} className="mr-1" />
                    Settings
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
