import { SignupForm } from "@/components/auth/signup-form";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    inviteToken?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <SignupForm error={params.error} inviteToken={params.inviteToken} />
    </main>
  );
}
