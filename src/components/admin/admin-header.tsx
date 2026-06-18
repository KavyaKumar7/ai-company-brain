import { PageHeader } from "@/components/layout/page-header";
import type { AppRole } from "@/lib/auth/types";

type AdminHeaderProps = {
  title: string;
  description: string;
  role: AppRole;
};

export function AdminHeader({ title, description, role }: AdminHeaderProps) {
  return (
    <PageHeader
      eyebrow={role === "admin" ? "Admin console" : "Manager console"}
      title={title}
      description={description}
    />
  );
}
