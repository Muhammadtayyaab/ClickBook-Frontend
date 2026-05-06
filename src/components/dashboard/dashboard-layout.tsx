import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  LayoutTemplate,
  Globe,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  Bell,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { to: "/dashboard/media", label: "Media", icon: ImageIcon },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/dashboard/hosted", label: "Hosted Sites", icon: Globe },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, token, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/signin", replace: true });
  };

  useEffect(() => {
    if (!token) navigate({ to: "/signin", replace: true });
  }, [token, navigate]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking credentials…</p>
      </div>
    );
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const currentLabel = NAV_ITEMS.find((i) => isActive(i.to, i.exact))?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarInner isActive={isActive} onLogout={handleLogout} userName={user?.name} />
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card lg:hidden">
            <SidebarInner
              isActive={isActive}
              onLogout={handleLogout}
              userName={user?.name}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-medium text-muted-foreground">{currentLabel}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="text-left">
              <p className="text-xs font-medium leading-none">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarInner({
  isActive,
  onLogout,
  onNavigate,
  userName,
}: {
  isActive: (to: string, exact?: boolean) => boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  userName?: string;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.to as any}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        {userName && (
          <p className="mb-2 px-3 text-xs text-muted-foreground">Signed in as {userName}</p>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );
}