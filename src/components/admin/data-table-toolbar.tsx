import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}

/** Search + right-aligned filter/action slot used on all admin list pages. */
export function DataTableToolbar({ search, onSearchChange, placeholder = "Search…", children }: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
