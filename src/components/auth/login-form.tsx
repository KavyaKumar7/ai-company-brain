import Link from "next/link";

import { logIn } from "@/app/login/actions";
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

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Access your organization workspace and dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={logIn} className="space-y-5">
          {message ? (
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Log in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Need a workspace?{" "}
          <Link
            className="font-medium text-foreground underline"
            href="/signup"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
