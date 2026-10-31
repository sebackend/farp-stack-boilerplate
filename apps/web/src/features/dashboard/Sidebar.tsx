import { NavLink } from "react-router";
import {
  LayoutDashboard,
  ListChecks,
  CalendarClock,
  Activity,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { useLogoutMutation } from "../auth/authApi";
import { logout } from "../auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useNavigate } from "react-router";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string; // present => real route; absent => mocked/disabled
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Only Dashboard + Tasks are wired to real routes; the rest are mocked
// placeholders that demonstrate the layout and can be wired up later.
const NAV_GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Tasks", icon: ListChecks, to: "/tasks" },
      { label: "Calendar", icon: CalendarClock },
      { label: "Activity", icon: Activity },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Projects", icon: FolderKanban },
      { label: "Team", icon: Users },
      { label: "Reports", icon: BarChart3 },
      { label: "Settings", icon: Settings },
    ],
  },
];

function initialsOf(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const chars = (parts.length >= 2 ? parts[0]![0]! + parts[1]![0]! : name.slice(0, 2)) || "?";
  return chars.toUpperCase();
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <CheckSquare className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-sm font-bold tracking-wide text-sidebar-primary dark:text-sidebar-foreground">
            TASKFLOW
          </span>
          <span className="font-mono text-[9px] tracking-widest text-sidebar-foreground">
            CONTROL v1.0
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="px-2 py-2 font-mono text-[9px] uppercase tracking-widest text-sidebar-foreground">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                if (!item.to) {
                  return (
                    <li key={item.label}>
                      <span
                        title="Coming soon"
                        className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/60"
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                        {item.label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition ${
                          isActive
                            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex items-center gap-2.5 border-t border-sidebar-border p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="font-mono text-xs font-bold text-primary-foreground">
            {user ? initialsOf(user.email) : "?"}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-semibold text-sidebar-primary dark:text-sidebar-foreground">
            {user?.email ?? "Not signed in"}
          </span>
          <button
            onClick={handleLogout}
            className="text-left font-mono text-[9px] uppercase tracking-wide text-sidebar-foreground hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
