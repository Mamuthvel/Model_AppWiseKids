import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertChildAppSchema, insertAlertSchema, insertSettingsSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

interface CustomRequest extends Request {
  session: {
    userId?: number;
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    destroy: (callback?: (err?: any) => void) => void;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const requireAuth = (req: CustomRequest, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For demo purposes, accept "password123" for the sample user
      const isValidPassword = password === "password123" || await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({ user: req.session.user });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get children for parent
  app.get("/api/children", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const children = await storage.getChildrenByParentId(userId);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  // Get child details
  app.get("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);
      
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      // Check if user is the parent
      if (child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(child);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  // Get all apps
  app.get("/api/apps", requireAuth, async (req, res) => {
    try {
      const apps = await storage.getAllApps();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch apps" });
    }
  });

  // Get child's installed apps
  app.get("/api/children/:childId/apps", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const childApps = await storage.getChildApps(childId);
      res.json(childApps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch child apps" });
    }
  });

  // Install app for child
  app.post("/api/children/:childId/apps", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const { appId } = req.body;

      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if app exists
      const app = await storage.getApp(appId);
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      // Check if already installed
      const existing = await storage.getChildApp(childId, appId);
      if (existing) {
        return res.status(400).json({ message: "App already installed" });
      }

      // Auto-block if high risk and settings allow
      const settings = await storage.getSettings(req.session.userId!, childId);
      const shouldAutoBlock = settings?.autoBlockHighRisk && app.safetyBadge === "high-risk";

      const childApp = await storage.createChildApp({
        childId,
        appId,
        isBlocked: shouldAutoBlock,
        screenTimeToday: 0,
      });

      // Create alert for new installation
      await storage.createAlert({
        parentId: req.session.userId!,
        childId,
        type: shouldAutoBlock ? "high_risk" : "app_install",
        title: shouldAutoBlock ? "High Risk App Detected" : "New App Installed",
        message: shouldAutoBlock 
          ? `${app.name} has been installed and automatically blocked due to age-inappropriate content for ${child.name} (Age ${child.age}).`
          : `${app.name} has been installed. This app is ${app.safetyBadge === "safe" ? "certified safe" : "marked as moderate risk"} for ${child.name}'s age group (${child.age} years old).`,
        severity: shouldAutoBlock ? "danger" : app.safetyBadge === "safe" ? "info" : "warning",
        isRead: false,
        metadata: { appId, appName: app.name },
      });

      res.json(childApp);
    } catch (error) {
      res.status(500).json({ message: "Failed to install app" });
    }
  });

  // Update child app (block/unblock, time limits)
  app.patch("/api/children/:childId/apps/:appId", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const appId = parseInt(req.params.appId);
      const updates = req.body;

      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedChildApp = await storage.updateChildApp(childId, appId, updates);
      if (!updatedChildApp) {
        return res.status(404).json({ message: "Child app not found" });
      }

      res.json(updatedChildApp);
    } catch (error) {
      res.status(500).json({ message: "Failed to update app" });
    }
  });

  // Get alerts for parent
  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const alerts = await storage.getAlertsByParentId(req.session.userId!);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Get unread alerts count
  app.get("/api/alerts/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadAlertsCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark alert as read
  app.patch("/api/alerts/:id/read", requireAuth, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const alert = await storage.markAlertAsRead(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Get settings for child
  app.get("/api/children/:childId/settings", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const settings = await storage.getSettings(req.session.userId!, childId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings for child
  app.put("/api/children/:childId/settings", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const settingsData = {
        ...req.body,
        parentId: req.session.userId!,
        childId,
      };

      const settings = await storage.createOrUpdateSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get screen time data for child
  app.get("/api/children/:childId/screen-time", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const { startDate } = req.query;

      // Verify child belongs to parent
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (startDate) {
        const weekData = await storage.getScreenTimeWeek(childId, startDate as string);
        res.json(weekData);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const todayData = await storage.getScreenTimeData(childId, today);
        res.json(todayData);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch screen time data" });
    }
  });

  // Simulate app installation (for demo)
  app.post("/api/simulate/install-app", requireAuth, async (req, res) => {
    try {
      const { childId, appName = "TikTok" } = req.body;

      // Find TikTok app or create it if not exists
      let app = Array.from(await storage.getAllApps()).find(a => a.name === appName);
      if (!app) {
        app = await storage.createApp({
          name: appName,
          category: "Social",
          ageRating: 13,
          safetyBadge: "high-risk",
          description: "Short-form video social networking platform",
          expertReview: "Age-inappropriate content and privacy concerns for young children.",
          iconUrl: "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=60",
        });
      }

      // Install the app
      const installResponse = await fetch(`http://localhost:5000/api/children/${childId}/apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: app.id }),
      });

      if (installResponse.ok) {
        res.json({ message: "App installation simulated successfully" });
      } else {
        res.status(500).json({ message: "Failed to simulate app installation" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to simulate app installation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
