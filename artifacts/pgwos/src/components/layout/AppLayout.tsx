import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  ListTodo, 
  Calendar as CalendarIcon, 
  BookOpen, 
  BarChart2, 
  Settings as SettingsIcon,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/leads", label: "Leads (CRM)", icon: Users },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const NavLinks = () => (
    <div className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} className="block">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-12 rounded-xl transition-all ${
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
      <div className="mt-8 border-t border-border pt-4">
        <Link href="/settings" className="block">
          <Button
            variant={location === "/settings" ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 h-12 rounded-xl transition-all ${
              location === "/settings" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl z-20">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-display font-bold text-xl">P</span>
            </div>
            <h1 className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              PGWOS
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full h-16 border-b border-border/50 bg-background/80 backdrop-blur-lg z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold">P</span>
          </div>
          <span className="font-display font-bold text-lg">PGWOS</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card p-6 border-r-border/50">
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-display font-bold text-xl">P</span>
              </div>
              <h1 className="font-display font-bold text-2xl tracking-tight">PGWOS</h1>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto pt-16 md:pt-0">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
