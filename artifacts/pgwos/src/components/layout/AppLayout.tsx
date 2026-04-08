import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetStreak, useGetSettings } from "@workspace/api-client-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AnimatedDock } from "@/components/ui/animated-dock";

const MSIcon = ({ name }: { name: string }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: 22,
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    }}
  >
    {name}
  </span>
);

const NAV_ITEMS = [
  { href: "/",          icon: <MSIcon name="home" />,             label: "Home"      },
  { href: "/tasks",     icon: <MSIcon name="task_alt" />,         label: "Tasks"     },
  { href: "/habits",    icon: <MSIcon name="self_improvement" />, label: "Growth"    },
  { href: "/videos",    icon: <MSIcon name="video_library" />,    label: "Library"   },
  { href: "/calendar",  icon: <MSIcon name="calendar_month" />,   label: "Schedule"  },
  { href: "/notes",     icon: <MSIcon name="auto_stories" />,     label: "Notes"     },
  { href: "/analytics", icon: <MSIcon name="bar_chart" />,        label: "Insights"  },
];

const PAGE_TITLES: Record<string, string> = {
  "/":          "Today",
  "/tasks":     "Action Items",
  "/habits":    "Daily Growth",
  "/leads":     "Pipeline",
  "/calendar":  "Schedule",
  "/notes":     "Digital Sanctuary",
  "/analytics": "Analytics",
  "/settings":  "Settings",
  "/videos":    "Video Library",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: streak } = useGetStreak();
  const { data: settings } = useGetSettings();
  const { isOnline } = useNetworkStatus();

  const pageTitle = PAGE_TITLES[location] ?? "PGWOS";

  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e0e] text-white font-['Inter']">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 bg-[#ffbd5c] text-[#000] text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          You're offline — reading from cache
        </div>
      )}

      {/* Top Header */}
      <header className={`fixed left-0 right-0 z-50 bg-[#0e0e0e]/90 backdrop-blur-xl ${!isOnline ? "top-8" : "top-0"}`}>
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[rgba(72,72,71,0.3)] bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <span className="text-[#94aaff] font-['Manrope'] font-extrabold text-xs">
                {settings?.userName?.charAt(0)?.toUpperCase() || "P"}
              </span>
            </div>
            <h1 className="font-['Manrope'] font-bold text-xl tracking-tight text-white">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {(streak?.currentStreak ?? 0) > 0 && (
              <div className="px-3 py-1 rounded-full bg-[#2c2c2c] text-white font-['Manrope'] font-bold text-sm">
                🔥 {streak?.currentStreak}
              </div>
            )}
            <Link href="/settings">
              <button className="p-2 rounded-full text-[#adaaaa] hover:bg-[#2c2c2c] transition-colors active:scale-95">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-[72px] pb-[100px] w-full max-w-5xl mx-auto px-4 sm:px-6">
        {children}
      </main>

      {/* Animated Dock — full width for edge-to-edge scroll on mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pb-[max(16px,env(safe-area-inset-bottom,16px))] pt-2 bg-[#0e0e0e]/70 backdrop-blur-2xl"
        style={{ borderTop: "1px solid rgba(72,72,71,0.12)" }}
      >
        <AnimatedDock items={NAV_ITEMS} className="w-full" />
      </div>
    </div>
  );
}
