import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { AppsView } from "@/components/apps-view";
import { AlertsView } from "@/components/alerts-view";
import { SettingsView } from "@/components/settings-view";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@shared/schema";

const VIEWS = {
  "/dashboard": "dashboard",
  "/apps": "apps", 
  "/alerts": "alerts",
  "/settings": "settings",
} as const;

export default function Dashboard() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [selectedChildId, setSelectedChildId] = useState<number>(1); // Default to first child

  const currentView = VIEWS[location as keyof typeof VIEWS] || "dashboard";

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const simulateAppInstall = async () => {
    try {
      await apiRequest("POST", "/api/simulate/install-app", {
        childId: selectedChildId,
        appName: "TikTok"
      });
      
      toast({
        title: "App Installation Simulated",
        description: "TikTok installation detected! Alert sent to parent dashboard.",
      });
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: "Failed to simulate app installation.",
        variant: "destructive",
      });
    }
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedChild = children.find((child: Child) => child.id === selectedChildId);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Child Selector and Demo Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentView === "dashboard" && "Dashboard"}
              {currentView === "apps" && "App Management"}
              {currentView === "alerts" && "Alerts & Notifications"}
              {currentView === "settings" && "Settings"}
            </h1>
            
            {children.length > 0 && (
              <Select 
                value={selectedChildId.toString()} 
                onValueChange={(value) => setSelectedChildId(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child: Child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.name} (Age {child.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Demo Controls */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={simulateAppInstall}
              className="text-xs"
            >
              📱 Simulate App Install (Demo)
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {childrenLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading child data...</div>
            </CardContent>
          </Card>
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No children found</h2>
                <p className="text-muted-foreground">Add a child to get started with parental controls.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentView === "dashboard" && (
              <DashboardOverview selectedChildId={selectedChildId} />
            )}
            
            {currentView === "apps" && (
              <AppsView selectedChildId={selectedChildId} />
            )}
            
            {currentView === "alerts" && (
              <AlertsView />
            )}
            
            {currentView === "settings" && (
              <SettingsView selectedChildId={selectedChildId} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
