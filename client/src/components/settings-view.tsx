import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Settings, Child } from "@shared/schema";

interface SettingsViewProps {
  selectedChildId: number;
}

const settingsSchema = z.object({
  dailyScreenTimeLimit: z.number().min(30).max(480),
  bedtimeStart: z.string(),
  bedtimeEnd: z.string(),
  weekendExtendedHours: z.boolean(),
  autoBlockHighRisk: z.boolean(),
  reviewModerateApps: z.boolean(),
  ageOverride: z.number().optional(),
  emailNotifications: z.boolean(),
  notificationFrequency: z.enum(["real-time", "daily", "weekly"]),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsView({ selectedChildId }: SettingsViewProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["/api/children", selectedChildId, "settings"],
    enabled: !!selectedChildId,
  });

  const { data: child } = useQuery({
    queryKey: ["/api/children", selectedChildId],
    enabled: !!selectedChildId,
  });

  const { data: children = [] } = useQuery({
    queryKey: ["/api/children"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dailyScreenTimeLimit: 180,
      bedtimeStart: "20:00",
      bedtimeEnd: "07:00",
      weekendExtendedHours: true,
      autoBlockHighRisk: true,
      reviewModerateApps: true,
      emailNotifications: true,
      notificationFrequency: "real-time",
    },
  });

  // Update form when settings data is loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        dailyScreenTimeLimit: settings.dailyScreenTimeLimit,
        bedtimeStart: settings.bedtimeStart,
        bedtimeEnd: settings.bedtimeEnd,
        weekendExtendedHours: settings.weekendExtendedHours,
        autoBlockHighRisk: settings.autoBlockHighRisk,
        reviewModerateApps: settings.reviewModerateApps,
        ageOverride: settings.ageOverride || undefined,
        emailNotifications: settings.emailNotifications,
        notificationFrequency: settings.notificationFrequency as any,
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch(`/api/children/${selectedChildId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChildId, "settings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const screenTimeHours = Math.floor(form.watch("dailyScreenTimeLimit") / 60);
  const screenTimeMinutes = form.watch("dailyScreenTimeLimit") % 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Screen Time Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Screen Time Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="dailyScreenTimeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Screen Time Limit</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          max={480}
                          min={30}
                          step={15}
                          className="w-full"
                        />
                        <div className="text-sm font-medium text-gray-900">
                          {screenTimeHours}h {screenTimeMinutes}m
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedtimeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedtime Start</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedtimeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedtime End</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Device will be locked between these times
              </FormDescription>

              <FormField
                control={form.control}
                name="weekendExtendedHours"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Weekend Extended Hours</FormLabel>
                      <FormDescription>
                        Allow extra screen time on weekends
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* App Safety Settings */}
      <Card>
        <CardHeader>
          <CardTitle>App Safety Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="autoBlockHighRisk"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-block High Risk Apps</FormLabel>
                      <FormDescription>
                        Automatically block apps with red safety badges
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewModerateApps"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Review Moderate Apps</FormLabel>
                      <FormDescription>
                        Require approval for yellow badge apps
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Override</FormLabel>
                    <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={child ? `Use actual age (${child.age} years)` : "Select age"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Use actual age ({child?.age} years)</SelectItem>
                        <SelectItem value={(child?.age || 8) - 2}>More restrictive ({(child?.age || 8) - 2} years)</SelectItem>
                        <SelectItem value={(child?.age || 8) + 2}>Less restrictive ({(child?.age || 8) + 2} years)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Adjust app recommendations based on different age criteria
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Email Notifications</FormLabel>
                      <FormDescription>
                        Receive alerts via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Frequency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="real-time">Real-time</SelectItem>
                        <SelectItem value="daily">Daily summary</SelectItem>
                        <SelectItem value="weekly">Weekly summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <Input 
                  type="email" 
                  value={user?.email || ""} 
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  To change your email, contact support
                </p>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account & Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Name</label>
              <Input value={user?.username || ""} disabled className="bg-muted" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connected Children</label>
              <div className="space-y-2">
                {children.map((child: Child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={child.profileImage || ""} />
                        <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{child.name}</p>
                        <p className="text-sm text-neutral-600">Age {child.age} • Device: {child.deviceInfo}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateSettingsMutation.isPending}
                className="w-full"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
