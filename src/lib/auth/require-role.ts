import "server-only";

import { redirect } from "next/navigation";

import { getOrgContext } from "./get-org-context";
import type { AppRole } from "./types";

const roleRank: Record<AppRole, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
};

export async function requireRole(minimumRole: AppRole = "employee") {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  if (roleRank[context.role] < roleRank[minimumRole]) {
    redirect("/dashboard");
  }

  return context;
}
