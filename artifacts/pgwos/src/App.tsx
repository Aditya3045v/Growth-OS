import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "./components/layout/AppLayout";
import { CheckInModal } from "./components/CheckInModal";
import { useGetSettings } from "@workspace/api-client-react";

import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Leads from "./pages/Leads";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Notes from "./pages/Notes";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ThemeController() {
  const { data: settings } = useGetSettings();

  useEffect(() => {
    const isDark = settings?.darkMode ?? true;
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0e0e0e");
    } else {
      document.documentElement.classList.remove("dark");
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f5f5f5");
    }
  }, [settings?.darkMode]);

  return null;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/habits" component={Habits} />
        <Route path="/leads" component={Leads} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/notes" component={Notes} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <CheckInModal />
    </AppLayout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");

    if ("serviceWorker" in navigator) {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const swUrl = `${base}/sw.js`;
      navigator.serviceWorker
        .register(swUrl, { scope: `${base}/` })
        .then((reg) => {
          console.log("[PGWOS] Service Worker registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PGWOS] Service Worker registration failed:", err);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ThemeController />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
