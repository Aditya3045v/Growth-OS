import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetStreak, useGetSettings } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/",          icon: "home",         label: "Home"     },
  { href: "/tasks",     icon: "task_alt",     label: "Tasks"    },
  { href: "/habits",    icon: "self_improvement", label: "Growth" },
  { href: "/leads",     icon: "people",       label: "Pipeline" },
  { href: "/analytics", icon: "bar_chart",    label: "Insights" },
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
};

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: streak } = useGetStreak();
  const { data: settings } = useGetSettings();

  const pageTitle = PAGE_TITLES[location] ?? "PGWOS";

  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e0e] text-white font-['Inter']">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e]/90 backdrop-blur-xl">
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
      <main className="flex-1 pt-[72px] pb-[80px] w-full max-w-5xl mx-auto px-4 sm:px-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-6 pb-safe pt-3 pb-5 bg-[#0e0e0e]/85 backdrop-blur-2xl border-t border-[rgba(72,72,71,0.15)] rounded-t-3xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.6)]">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
                  isActive ? "" : "text-[#adaaaa] hover:text-white"
                }`}
              >
                {isActive ? (
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#94aaff] to-[#809bff] text-[#0e0e0e] shadow-[0_4px_20px_rgba(148,170,255,0.3)]">
                    <span className="material-symbols-outlined fill text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                ) : (
                  <div className="p-3">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                )}
              </button>
            </Link>
          );
        })}

        {/* Notes quick access */}
        <Link href="/notes">
          <button
            className={`flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
              location === "/notes" ? "" : "text-[#adaaaa] hover:text-white"
            }`}
          >
            {location === "/notes" ? (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#94aaff] to-[#809bff] text-[#0e0e0e] shadow-[0_4px_20px_rgba(148,170,255,0.3)]">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_stories
                </span>
              </div>
            ) : (
              <div className="p-3">
                <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              </div>
            )}
          </button>
        </Link>
      </nav>
    </div>
  );
}
