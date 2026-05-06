import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  LayoutTemplate,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  Bell,
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
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

/**
 * AdminLayout wraps every /admin/* route.
 * - Guards against unauthenticated and non-admin users.
 * - Provides sidebar, top navbar, and content Outlet.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, token, logout } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/signin", replace: true });
  };

  // Client-side guard: redirect non-admins to /signin.
  useEffect(() => {
    if (!token) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (user && user.role !== "admin") {
      navigate({ to: "/templates", replace: true });
    }
  }, [token, user, navigate]);

  if (!token || (user && user.role !== "admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking credentials…</p>
      </div>
    );
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <SidebarInner isActive={isActive} onLogout={handleLogout} />
      </aside>

      {/* Sidebar (mobile drawer) */}
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
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main */}
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
            <h1 className="text-sm font-medium text-muted-foreground">
              {NAV_ITEMS.find((i) => isActive(i.to, i.exact))?.label ?? "Admin"}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
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
}: {
  isActive: (to: string, exact?: boolean) => boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-base font-semibold tracking-tight">{APP_NAME} Admin</span>
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
