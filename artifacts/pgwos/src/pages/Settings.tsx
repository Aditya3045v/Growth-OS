import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Moon, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();

  const [darkMode, setDarkMode] = useState(true);

  // Sync initial dark mode state
  useEffect(() => {
    if (settings) {
      setDarkMode(settings.darkMode);
    }
  }, [settings]);

  // Apply dark mode immediately when toggled
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    updateSettings.mutate({
      data: {
        userName: fd.get("userName") as string,
        darkMode,
        morningReminderEnabled: fd.get("morningReminderEnabled") === "on",
        morningReminderTime: fd.get("morningReminderTime") as string,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      }
    });
  };

  return (
    <div className="space-y-8 pb-20 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your operating system preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6 bg-card border-border/50 rounded-3xl">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><User className="h-5 w-5" /></div>
            <h2 className="text-xl font-bold">Profile</h2>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Display Name</label>
              <Input name="userName" defaultValue={settings?.userName} className="bg-background h-11" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50 rounded-3xl">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-accent/10 text-accent rounded-lg"><Moon className="h-5 w-5" /></div>
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">The best way to work.</p>
            </div>
            <Switch 
              checked={darkMode} 
              onCheckedChange={setDarkMode} 
            />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border/50 rounded-3xl">
          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Bell className="h-5 w-5" /></div>
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          
          <div className="space-y-6 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Morning Reminder</p>
                <p className="text-sm text-muted-foreground">Start the day right.</p>
              </div>
              <Switch name="morningReminderEnabled" defaultChecked={settings?.morningReminderEnabled} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Morning Time</label>
              <Input name="morningReminderTime" type="time" defaultValue={settings?.morningReminderTime} className="bg-background h-11" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="px-8 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:opacity-90" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
