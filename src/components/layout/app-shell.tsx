import type { ReactNode } from "react";
import { BrainCircuit, CheckCircle2, ChevronDown, LogOut, ShieldCheck } from "lucide-react";

import { logOut } from "@/app/dashboard/actions";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Button } from "@/components/ui/button";
import type { OrgContext } from "@/lib/auth/types";

type AppShellProps = {
  children: ReactNode;
  context: OrgContext;
};

function getInitials(context: OrgContext) {
  const source = context.fullName || context.email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, context }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-full flex-col px-3 py-4">
          <div className="flex h-12 items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/15">
              <BrainCircuit className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Company Brain
              </p>
              <p className="text-[11px] text-sidebar-foreground/45">Verified intelligence</p>
            </div>
          </div>

          <div className="mx-2 my-4 border-t border-sidebar-border" />

          <button
            className="mx-1 flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
            type="button"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">
              {context.organizationName.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                {context.organizationName}
              </span>
              <span className="block text-[11px] capitalize text-sidebar-foreground/45">
                {context.role} workspace
              </span>
            </span>
            <ChevronDown className="size-3.5 text-sidebar-foreground/35" />
          </button>

          <div className="mt-5 flex-1 overflow-y-auto px-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/35">
              Workspace
            </p>
            <AppNavigation context={context} />
          </div>

          <div className="mx-1 mb-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <ShieldCheck className="size-3.5" />
              Approved sources only
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-sidebar-foreground/42">
              Answers stay grounded in reviewed company knowledge.
            </p>
          </div>

          <div className="flex items-center gap-2 border-t border-sidebar-border px-1 pt-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">
              {getInitials(context)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {context.fullName || context.email}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/40">{context.email}</p>
            </div>
            <form action={logOut}>
              <Button aria-label="Log out" size="icon-sm" type="submit" variant="ghost">
                <LogOut className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/88 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <BrainCircuit className="size-5 text-primary" />
              <span className="truncate text-sm font-semibold">Company Brain</span>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              Knowledge layer operational
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground sm:inline-flex">
                {context.role}
              </span>
              <div className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold">
                {getInitials(context)}
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 bg-sidebar px-3 py-2 lg:hidden">
            <AppNavigation compact context={context} />
          </div>
        </header>

        <main className="animate-page-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
