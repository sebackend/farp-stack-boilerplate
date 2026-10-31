import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import Sidebar from "./Sidebar";
import { useTheme } from "./useTheme";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  /** Right-aligned topbar actions (buttons, etc.). */
  actions?: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
}: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-7 py-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-card-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-7">{children}</main>
      </div>
    </div>
  );
}
