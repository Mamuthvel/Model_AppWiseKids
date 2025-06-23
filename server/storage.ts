import { 
  users, children, apps, childApps, alerts, settings, screenTimeData,
  type User, type InsertUser, type Child, type InsertChild, 
  type App, type InsertApp, type ChildApp, type InsertChildApp,
  type Alert, type InsertAlert, type Settings, type InsertSettings,
  type ScreenTimeData, type InsertScreenTimeData
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Child methods
  getChildrenByParentId(parentId: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<Child>): Promise<Child | undefined>;
  
  // App methods
  getAllApps(): Promise<App[]>;
  getApp(id: number): Promise<App | undefined>;
  createApp(app: InsertApp): Promise<App>;
  
  // Child App methods
  getChildApps(childId: number): Promise<(ChildApp & { app: App })[]>;
  getChildApp(childId: number, appId: number): Promise<ChildApp | undefined>;
  createChildApp(childApp: InsertChildApp): Promise<ChildApp>;
  updateChildApp(childId: number, appId: number, updates: Partial<ChildApp>): Promise<ChildApp | undefined>;
  
  // Alert methods
  getAlertsByParentId(parentId: number): Promise<Alert[]>;
  getUnreadAlertsCount(parentId: number): Promise<number>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  
  // Settings methods
  getSettings(parentId: number, childId: number): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Screen Time methods
  getScreenTimeData(childId: number, date: string): Promise<ScreenTimeData | undefined>;
  getScreenTimeWeek(childId: number, startDate: string): Promise<ScreenTimeData[]>;
  createOrUpdateScreenTime(data: InsertScreenTimeData): Promise<ScreenTimeData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private children: Map<number, Child> = new Map();
  private apps: Map<number, App> = new Map();
  private childApps: Map<string, ChildApp> = new Map(); // key: childId-appId
  private alerts: Map<number, Alert> = new Map();
  private settings: Map<string, Settings> = new Map(); // key: parentId-childId
  private screenTimeData: Map<string, ScreenTimeData> = new Map(); // key: childId-date
  private currentId: number = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample parent user
    const parent: User = {
      id: 1,
      username: "sarah.johnson",
      password: "$2b$10$xyz...", // hashed password for "password123"
      email: "sarah.johnson@email.com",
      role: "parent",
      parentId: null,
      createdAt: new Date(),
    };
    this.users.set(1, parent);

    // Create sample child
    const child: Child = {
      id: 1,
      parentId: 1,
      name: "Emma Johnson",
      age: 8,
      deviceInfo: "iPhone 13",
      profileImage: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=100",
      createdAt: new Date(),
    };
    this.children.set(1, child);

    // Create sample apps
    const sampleApps: App[] = [
      {
        id: 1,
        name: "Khan Academy Kids",
        category: "Educational",
        ageRating: 3,
        safetyBadge: "safe",
        description: "Educational learning platform for early childhood development",
        expertReview: "Excellent educational content with no ads or inappropriate material.",
        iconUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=60",
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "ABC Mouse",
        category: "Educational",
        ageRating: 2,
        safetyBadge: "safe",
        description: "Comprehensive early learning curriculum",
        expertReview: "Well-designed curriculum with age-appropriate content.",
        iconUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=60",
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "Roblox",
        category: "Gaming",
        ageRating: 9,
        safetyBadge: "moderate",
        description: "Online gaming platform with user-generated content",
        expertReview: "Contains user-generated content that may vary in appropriateness.",
        iconUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=60",
        createdAt: new Date(),
      },
      {
        id: 4,
        name: "TikTok",
        category: "Social",
        ageRating: 13,
        safetyBadge: "high-risk",
        description: "Short-form video social networking platform",
        expertReview: "Age-inappropriate content and privacy concerns for young children.",
        iconUrl: "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=60",
        createdAt: new Date(),
      },
      {
        id: 5,
        name: "Drawing Pad",
        category: "Creative",
        ageRating: 6,
        safetyBadge: "moderate",
        description: "Digital drawing and art creation app",
        expertReview: "Safe creative tool with some in-app purchase prompts.",
        iconUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=60",
        createdAt: new Date(),
      },
    ];

    sampleApps.forEach(app => this.apps.set(app.id, app));

    // Create sample child apps
    const sampleChildApps: ChildApp[] = [
      {
        id: 1,
        childId: 1,
        appId: 1,
        isBlocked: false,
        screenTimeToday: 83,
        installedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: 2,
        childId: 1,
        appId: 2,
        isBlocked: false,
        screenTimeToday: 45,
        installedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 3,
        childId: 1,
        appId: 3,
        isBlocked: true,
        screenTimeToday: 0,
        installedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 4,
        childId: 1,
        appId: 4,
        isBlocked: true,
        screenTimeToday: 0,
        installedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
    ];

    sampleChildApps.forEach(childApp => {
      this.childApps.set(`${childApp.childId}-${childApp.appId}`, childApp);
    });

    // Create sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: 1,
        parentId: 1,
        childId: 1,
        type: "high_risk",
        title: "High Risk App Detected",
        message: "TikTok has been installed and automatically blocked due to age-inappropriate content for Emma (Age 8).",
        severity: "danger",
        isRead: false,
        metadata: { appId: 4, appName: "TikTok" },
        createdAt: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: 2,
        parentId: 1,
        childId: 1,
        type: "screen_time",
        title: "Screen Time Limit Exceeded",
        message: "Emma's daily screen time limit (3 hours) was exceeded by 45 minutes. Current usage: 3h 45m",
        severity: "warning",
        isRead: false,
        metadata: { limitMinutes: 180, actualMinutes: 225 },
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: 3,
        parentId: 1,
        childId: 1,
        type: "app_install",
        title: "New Educational App Installed",
        message: "Khan Academy Kids has been installed. This app is certified safe for Emma's age group (8 years old).",
        severity: "info",
        isRead: false,
        metadata: { appId: 1, appName: "Khan Academy Kids" },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ];

    sampleAlerts.forEach(alert => this.alerts.set(alert.id, alert));

    // Create sample settings
    const sampleSettings: Settings = {
      id: 1,
      parentId: 1,
      childId: 1,
      dailyScreenTimeLimit: 180,
      bedtimeStart: "20:00",
      bedtimeEnd: "07:00",
      weekendExtendedHours: true,
      autoBlockHighRisk: true,
      reviewModerateApps: true,
      ageOverride: null,
      emailNotifications: true,
      notificationFrequency: "real-time",
      updatedAt: new Date(),
    };
    this.settings.set("1-1", sampleSettings);

    // Create sample screen time data
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const screenTime: ScreenTimeData = {
        id: i + 1,
        childId: 1,
        date: dateStr,
        totalMinutes: Math.floor(Math.random() * 120) + 120, // 2-4 hours
        appBreakdown: {
          "1": Math.floor(Math.random() * 60) + 30,
          "2": Math.floor(Math.random() * 60) + 30,
          "3": Math.floor(Math.random() * 30),
        },
        createdAt: new Date(),
      };
      this.screenTimeData.set(`1-${dateStr}`, screenTime);
    }

    this.currentId = 10; // Start IDs from 10 to avoid conflicts
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getChildrenByParentId(parentId: number): Promise<Child[]> {
    return Array.from(this.children.values()).filter(child => child.parentId === parentId);
  }

  async getChild(id: number): Promise<Child | undefined> {
    return this.children.get(id);
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const id = this.currentId++;
    const child: Child = { ...insertChild, id, createdAt: new Date() };
    this.children.set(id, child);
    return child;
  }

  async updateChild(id: number, updates: Partial<Child>): Promise<Child | undefined> {
    const child = this.children.get(id);
    if (!child) return undefined;
    
    const updatedChild = { ...child, ...updates };
    this.children.set(id, updatedChild);
    return updatedChild;
  }

  async getAllApps(): Promise<App[]> {
    return Array.from(this.apps.values());
  }

  async getApp(id: number): Promise<App | undefined> {
    return this.apps.get(id);
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const id = this.currentId++;
    const app: App = { ...insertApp, id, createdAt: new Date() };
    this.apps.set(id, app);
    return app;
  }

  async getChildApps(childId: number): Promise<(ChildApp & { app: App })[]> {
    const childApps = Array.from(this.childApps.values()).filter(ca => ca.childId === childId);
    return childApps.map(childApp => {
      const app = this.apps.get(childApp.appId)!;
      return { ...childApp, app };
    });
  }

  async getChildApp(childId: number, appId: number): Promise<ChildApp | undefined> {
    return this.childApps.get(`${childId}-${appId}`);
  }

  async createChildApp(insertChildApp: InsertChildApp): Promise<ChildApp> {
    const id = this.currentId++;
    const childApp: ChildApp = { ...insertChildApp, id, installedAt: new Date() };
    this.childApps.set(`${childApp.childId}-${childApp.appId}`, childApp);
    return childApp;
  }

  async updateChildApp(childId: number, appId: number, updates: Partial<ChildApp>): Promise<ChildApp | undefined> {
    const key = `${childId}-${appId}`;
    const childApp = this.childApps.get(key);
    if (!childApp) return undefined;
    
    const updatedChildApp = { ...childApp, ...updates };
    this.childApps.set(key, updatedChildApp);
    return updatedChildApp;
  }

  async getAlertsByParentId(parentId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.parentId === parentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadAlertsCount(parentId: number): Promise<number> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.parentId === parentId && !alert.isRead).length;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentId++;
    const alert: Alert = { ...insertAlert, id, createdAt: new Date() };
    this.alerts.set(id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, isRead: true };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async getSettings(parentId: number, childId: number): Promise<Settings | undefined> {
    return this.settings.get(`${parentId}-${childId}`);
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const key = `${insertSettings.parentId}-${insertSettings.childId}`;
    const existing = this.settings.get(key);
    
    const settings: Settings = existing 
      ? { ...existing, ...insertSettings, updatedAt: new Date() }
      : { ...insertSettings, id: this.currentId++, updatedAt: new Date() };
    
    this.settings.set(key, settings);
    return settings;
  }

  async getScreenTimeData(childId: number, date: string): Promise<ScreenTimeData | undefined> {
    return this.screenTimeData.get(`${childId}-${date}`);
  }

  async getScreenTimeWeek(childId: number, startDate: string): Promise<ScreenTimeData[]> {
    const start = new Date(startDate);
    const data: ScreenTimeData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const screenTime = this.screenTimeData.get(`${childId}-${dateStr}`);
      if (screenTime) {
        data.push(screenTime);
      }
    }
    
    return data;
  }

  async createOrUpdateScreenTime(insertData: InsertScreenTimeData): Promise<ScreenTimeData> {
    const key = `${insertData.childId}-${insertData.date}`;
    const existing = this.screenTimeData.get(key);
    
    const data: ScreenTimeData = existing
      ? { ...existing, ...insertData }
      : { ...insertData, id: this.currentId++, createdAt: new Date() };
    
    this.screenTimeData.set(key, data);
    return data;
  }
}

export const storage = new MemStorage();
