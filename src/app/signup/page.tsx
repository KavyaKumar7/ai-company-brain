import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <SignupForm error={params.error} inviteToken={params.inviteToken} />
    </AuthShell>
  );
}
