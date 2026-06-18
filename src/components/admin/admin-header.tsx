import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { AppRole } from "@/lib/auth/types";

type AdminHeaderProps = {
  title: string;
  description: string;
  role: AppRole;
};

export function AdminHeader({ title, description, role }: AdminHeaderProps) {
  const canAdmin = role === "admin";
  const canManageLearning = role === "admin" || role === "manager";

  return (
    <header className="flex flex-col justify-between gap-4 rounded-lg border bg-background px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Admin console
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/dashboard"
        >
          Dashboard
        </Link>
        {canAdmin ? (
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/settings"
            >
              Settings
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/departments"
            >
              Departments
            </Link>
          </>
        ) : null}
        {canManageLearning ? (
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/onboarding"
            >
              Onboarding
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin/progress"
            >
              Progress
            </Link>
          </>
        ) : null}
        {canAdmin ? (
          <Link className={buttonVariants()} href="/admin/members">
            Members
          </Link>
        ) : null}
      </div>
    </header>
  );
}
