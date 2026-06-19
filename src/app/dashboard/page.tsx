import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrgContext } from "@/lib/auth/get-org-context";
import { getDashboardSummary } from "@/lib/data-access/dashboard";

export default async function DashboardPage() {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  const summary = await getDashboardSummary({
    orgId: context.orgId,
    userId: context.userId,
    role: context.role,
  });

  return <DashboardShell context={context} summary={summary} />;
}
