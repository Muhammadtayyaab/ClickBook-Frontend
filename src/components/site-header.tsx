import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Sparkles, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { APP_NAME } from "@/lib/brand";

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const isAuthed = Boolean(token && user);

  async function handleLogout() {
    await logout();
    navigate({ to: "/signin", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/templates" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Templates
          </Link>
          <a href="/#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="/#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="/#faq" className="transition-colors hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed && user?.role !== "admin" && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
          {isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm hover:bg-muted"
                  aria-label="Open account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {user?.name?.[0]?.toUpperCase() ?? <UserIcon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="hidden max-w-[120px] truncate pr-1 sm:inline">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm">{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "admin" ? (
                  <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin dashboard
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    My dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => navigate({ to: "/templates" })}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Browse templates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="hero">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
