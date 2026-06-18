import Link from "next/link";

import { acceptInvite } from "@/app/accept-invite/[token]/actions";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type AcceptInvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  const next = `/accept-invite/${token}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept organization invite</CardTitle>
          <CardDescription>
            Join the company workspace connected to this invite link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <form action={acceptInvite} className="space-y-4">
              <input name="token" type="hidden" value={token} />
              <p className="text-sm text-muted-foreground">
                You are signed in as {user.email}. Accepting will add this
                account to the invited organization if the email matches.
              </p>
              <Button type="submit" className="w-full" size="lg">
                Accept invite
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in with the invited email address, or create a new account
                using this invite.
              </p>
              <Link
                className={buttonVariants({ size: "lg", className: "w-full" })}
                href={`/login?next=${encodeURIComponent(next)}`}
              >
                Log in to accept
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full",
                })}
                href={`/signup?inviteToken=${encodeURIComponent(token)}`}
              >
                Create invited account
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
