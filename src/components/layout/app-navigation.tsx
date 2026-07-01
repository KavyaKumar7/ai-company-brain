"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  Bot,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import type { OrgContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Array<OrgContext["role"]>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
  { href: "/assistant", label: "Company AI", icon: Bot, roles: ["admin", "manager", "employee"] },
  { href: "/learning", label: "My learning", icon: GraduationCap, roles: ["admin", "manager", "employee"] },
  { href: "/admin/knowledge", label: "Knowledge", icon: FileText, roles: ["admin", "manager"] },
  { href: "/admin/onboarding", label: "Onboarding", icon: BookOpenCheck, roles: ["admin", "manager"] },
  { href: "/admin/progress", label: "Progress", icon: BarChart3, roles: ["admin", "manager"] },
  { href: "/admin/members", label: "Members", icon: Users, roles: ["admin"] },
  { href: "/admin/departments", label: "Departments", icon: Building2, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function AppNavigation({
  context,
  compact = false,
}: {
  context: OrgContext;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(context.role));

  return (
    <nav
      aria-label="Workspace navigation"
      className={compact ? "flex gap-2 overflow-x-auto pb-1" : "grid gap-1"}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative inline-flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200",
              compact && "h-9 shrink-0 border border-sidebar-border bg-sidebar",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/58 hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground"
            )}
            href={item.href}
            key={item.href}
          >
            {!compact && active ? (
              <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
            ) : null}
            <Icon
              className={cn(
                "size-4 transition-colors",
                active
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/42 group-hover:text-sidebar-foreground/80"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
