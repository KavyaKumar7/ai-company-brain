import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

import { logOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrgContext } from "@/lib/auth/types";

type AppShellProps = {
  children: ReactNode;
  context: OrgContext;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Array<OrgContext["role"]>;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "employee"],
  },
  {
    href: "/learning",
    label: "My learning",
    icon: GraduationCap,
    roles: ["admin", "manager", "employee"],
  },
  {
    href: "/admin/onboarding",
    label: "Onboarding",
    icon: BookOpenCheck,
    roles: ["admin", "manager"],
  },
  {
    href: "/admin/progress",
    label: "Progress",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    href: "/admin/members",
    label: "Members",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/admin/departments",
    label: "Departments",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin"],
  },
];

function Navigation({
  context,
  compact = false,
}: {
  context: OrgContext;
  compact?: boolean;
}) {
  const visibleItems = navItems.filter((item) => item.roles.includes(context.role));

  return (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "grid gap-1"}>
      {visibleItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={cn(
              "inline-flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              compact && "shrink-0 border bg-card/80"
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, context }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-sidebar/90 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/70 p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              AI
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sidebar-foreground/60">
              Company Brain
            </p>
            <h2 className="mt-2 line-clamp-2 text-lg font-semibold">
              {context.organizationName}
            </h2>
            <p className="mt-1 text-sm capitalize text-sidebar-foreground/65">
              {context.role}
            </p>
          </div>

          <div className="mt-6 flex-1">
            <Navigation context={context} />
          </div>

          <form action={logOut}>
            <Button className="w-full justify-start gap-3" type="submit" variant="outline">
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                AI Company Brain
              </p>
              <p className="line-clamp-1 font-semibold">{context.organizationName}</p>
            </div>
            <form action={logOut}>
              <Button size="sm" type="submit" variant="outline">
                Log out
              </Button>
            </form>
          </div>
          <Navigation compact context={context} />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
