import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { isSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe, sendTest, updateSchedule } = usePushNotifications();

  const [userName, setUserName] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState("07:00");
  const [morningMessage, setMorningMessage] = useState("Time for your daily check-in and habit review.");
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [eveningTime, setEveningTime] = useState("22:00");
  const [eveningMessage, setEveningMessage] = useState("Review your progress and plan tomorrow.");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || "");
      setDarkMode(settings.darkMode ?? true);
      setMorningEnabled(settings.morningReminderEnabled ?? true);
      setMorningTime(settings.morningReminderTime || "07:00");
      setEveningEnabled(settings.eveningReminderEnabled ?? true);
      setEveningTime(settings.eveningReminderTime || "21:00");
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      data: {
        userName,
        darkMode,
        morningReminderEnabled: morningEnabled,
        morningReminderTime: morningTime,
        eveningReminderEnabled: eveningEnabled,
        eveningReminderTime: eveningTime,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (isSubscribed) {
          updateSchedule(morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#94aaff] border-t-transparent animate-spin" />
          <span className="text-[#adaaaa] text-sm">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <p className="text-[10px] font-['Inter'] uppercase tracking-[0.2em] text-[#adaaaa] font-bold mb-1">Preferences</p>
        <h2 className="font-['Manrope'] font-extrabold text-4xl tracking-tight">Settings</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile */}
        <div className="bg-[#131313] rounded-2xl p-6 ds-ghost-border space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(72,72,71,0.1)]">
            <div className="p-2 bg-[rgba(148,170,255,0.1)] rounded-xl">
              <span className="material-symbols-outlined text-[#94aaff]">person</span>
            </div>
            <h3 className="font-['Manrope'] font-bold text-lg">Profile</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-['Inter'] uppercase tracking-widest text-[#adaaaa] font-bold">Display Name</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#262626] border-none rounded-xl py-4 px-5 text-white placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-medium"
              placeholder="Your name..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#94aaff]">
                  {darkMode ? "dark_mode" : "light_mode"}
                </span>
                {darkMode ? "Dark Mode" : "Light Mode"}
              </p>
              <p className="text-[#adaaaa] text-xs mt-0.5">{darkMode ? "Digital Sanctuary — easy on the eyes" : "Bright mode active"}</p>
            </div>
            <Toggle checked={darkMode} onChange={setDarkMode} color="#94aaff" />
          </div>
        </div>

        {/* Notification Reminders */}
        <div className="bg-[#131313] rounded-2xl p-6 ds-ghost-border space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(72,72,71,0.1)]">
            <div className="p-2 bg-[rgba(255,189,92,0.1)] rounded-xl">
              <span className="material-symbols-outlined text-[#ffbd5c]">notifications</span>
            </div>
            <h3 className="font-['Manrope'] font-bold text-lg">Reminders</h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#ffbd5c]">wb_sunny</span>
                Morning Check-in
              </p>
              <p className="text-[#adaaaa] text-xs mt-0.5">Daily morning reminder</p>
            </div>
            <Toggle checked={morningEnabled} onChange={setMorningEnabled} color="#ffbd5c" />
          </div>

          {morningEnabled && (
            <div className="space-y-3 p-4 bg-[#1a1a1a] rounded-xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[#adaaaa] text-sm font-bold uppercase tracking-widest text-[10px]">Morning time</span>
                <input
                  type="time"
                  value={morningTime}
                  onChange={(e) => setMorningTime(e.target.value)}
                  className="bg-[#262626] border-none rounded-xl text-white py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-['Manrope'] font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest">Personalized Message</label>
                <input
                  value={morningMessage}
                  onChange={(e) => setMorningMessage(e.target.value)}
                  className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white text-sm placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
                  placeholder="Wake up, champion!"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#94aaff]">bedtime</span>
                Evening Reflection
              </p>
              <p className="text-[#adaaaa] text-xs mt-0.5">End-of-day review reminder</p>
            </div>
            <Toggle checked={eveningEnabled} onChange={setEveningEnabled} color="#94aaff" />
          </div>

          {eveningEnabled && (
            <div className="space-y-3 p-4 bg-[#1a1a1a] rounded-xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[#adaaaa] text-sm font-bold uppercase tracking-widest text-[10px]">Evening time</span>
                <input
                  type="time"
                  value={eveningTime}
                  onChange={(e) => setEveningTime(e.target.value)}
                  className="bg-[#262626] border-none rounded-xl text-white py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#94aaff] font-['Manrope'] font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#adaaaa] font-bold uppercase tracking-widest">Personalized Message</label>
                <input
                  value={eveningMessage}
                  onChange={(e) => setEveningMessage(e.target.value)}
                  className="w-full bg-[#262626] border-none rounded-xl py-3 px-4 text-white text-sm placeholder:text-[#767575] focus:outline-none focus:ring-1 focus:ring-[#94aaff]"
                  placeholder="Reflect on your day..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        {isSupported && (
          <div className="bg-[#131313] rounded-2xl p-6 ds-ghost-border space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[rgba(72,72,71,0.1)]">
              <div className="p-2 bg-[rgba(92,253,128,0.1)] rounded-xl">
                <span className="material-symbols-outlined text-[#5cfd80]">notifications_active</span>
              </div>
              <h3 className="font-['Manrope'] font-bold text-lg">Push Notifications</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div>
                <p className="font-medium text-sm">Browser Notifications</p>
                <p className="text-[#adaaaa] text-xs mt-0.5">
                  {isSubscribed ? "Active — receiving push notifications" : permission === "denied" ? "Blocked by browser" : "Enable for scheduled reminders"}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSubscribed ? "bg-[rgba(92,253,128,0.1)] text-[#5cfd80]" : "bg-[rgba(72,72,71,0.1)] text-[#adaaaa]"}`}>
                {isSubscribed ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="flex gap-3">
              {!isSubscribed ? (
                <button
                  type="button"
                  disabled={pushLoading || permission === "denied"}
                  onClick={() => subscribe(morningEnabled, morningTime, morningMessage, eveningEnabled, eveningTime, eveningMessage)}
                  className="flex-1 ds-liquid-gradient py-3.5 rounded-2xl font-['Manrope'] font-bold text-[#000] text-sm ds-inner-glow active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  {pushLoading ? "Enabling..." : permission === "denied" ? "Blocked by Browser" : "Enable Notifications"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={pushLoading}
                    onClick={sendTest}
                    className="flex-1 py-3.5 rounded-2xl font-['Manrope'] font-bold text-sm bg-[rgba(148,170,255,0.1)] text-[#94aaff] border border-[rgba(148,170,255,0.2)] hover:bg-[rgba(148,170,255,0.15)] active:scale-[0.98] transition-all"
                  >
                    Test Notification
                  </button>
                  <button
                    type="button"
                    disabled={pushLoading}
                    onClick={unsubscribe}
                    className="flex-1 py-3.5 rounded-2xl font-['Manrope'] font-bold text-sm bg-[rgba(255,110,132,0.1)] text-[#ff6e84] border border-[rgba(255,110,132,0.2)] hover:bg-[rgba(255,110,132,0.15)] active:scale-[0.98] transition-all"
                  >
                    Disable
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="w-full ds-liquid-gradient py-4 rounded-2xl font-['Manrope'] font-extrabold text-[#000] text-base ds-inner-glow active:scale-[0.98] transition-transform shadow-[0_20px_40px_-10px_rgba(148,170,255,0.3)] disabled:opacity-50"
        >
          {updateSettings.isPending ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}


function Toggle({ checked, onChange, color }: { checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-12 h-7 rounded-full transition-colors duration-200 flex items-center px-0.5 relative"
      style={{ backgroundColor: checked ? color : "#262626" }}
    >
      <div
        className="absolute w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}
