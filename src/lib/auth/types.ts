export type AppRole = "admin" | "manager" | "employee";

export type OrgContext = {
  userId: string;
  orgId: string;
  organizationName: string;
  role: AppRole;
  email: string;
  fullName: string | null;
};
