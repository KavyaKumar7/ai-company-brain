import Link from "next/link";

import { signUp } from "@/app/signup/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupFormProps = {
  error?: string;
  inviteToken?: string;
};

export function SignupForm({ error, inviteToken }: SignupFormProps) {
  const isInviteSignup = Boolean(inviteToken);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isInviteSignup ? "Create your invited account" : "Create your workspace"}
        </CardTitle>
        <CardDescription>
          {isInviteSignup
            ? "Use the invited email address so we can attach you to the right organization."
            : "Your account will become the admin for this organization."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signUp} className="space-y-5">
          {inviteToken ? (
            <input name="inviteToken" type="hidden" value={inviteToken} />
          ) : null}
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {isInviteSignup ? null : (
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization name</Label>
              <Input id="organizationName" name="organizationName" required />
            </div>
          )}
          <Button type="submit" className="w-full" size="lg">
            {isInviteSignup ? "Create account" : "Create workspace"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline" href="/login">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
