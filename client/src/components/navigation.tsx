import { useState } from "react";
import React from "react";
import { Link, useLocation } from "wouter";
import { Bell, Home, Smartphone, AlertTriangle, Settings, Shield, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "apps", label: "Apps", icon: Smartphone, path: "/apps" },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, path: "/alerts" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/alerts/unread-count"],
    enabled: !!user,
  });

  const currentPath = location.split("?")[0];

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AppWiseKids</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link key={item.id} href={item.path}>
                  <a
                    className={`px-3 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-neutral-600 hover:text-primary"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.id === "alerts" && unreadCount?.count > 0 && (
                      <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                        {unreadCount.count}
                      </Badge>
                    )}
                  </a>
                </Link>
              );
            })}
          </div>

          {/* User Menu and Notifications */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <Link href="/alerts">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {unreadCount?.count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 px-1 py-0 text-xs min-w-[1.25rem] h-5"
                  >
                    {unreadCount.count}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32" />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-gray-700">{user?.username}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="ml-2 text-xs"
              >
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-6">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;
                    return (
                      <Link key={item.id} href={item.path}>
                        <a
                          className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon size={20} />
                          <span className="font-medium">{item.label}</span>
                          {item.id === "alerts" && unreadCount?.count > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {unreadCount.count}
                            </Badge>
                          )}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
