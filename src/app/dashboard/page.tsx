import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrgContext } from "@/lib/auth/get-org-context";

export default async function DashboardPage() {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  return <DashboardShell context={context} />;
}
