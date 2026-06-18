import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const foundationItems = [
  "Secure signup and login",
  "Organization workspace",
  "Admin, manager, employee roles",
  "Members and invites",
  "Departments",
  "Manual onboarding paths",
  "Lesson completion tracking",
  "Manager progress view",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            AI Company Brain
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your secure foundation for workforce enablement.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The app now has the production SaaS spine: company workspaces,
            roles, member management, departments, manual onboarding paths,
            employee learning, and progress tracking.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={buttonVariants({ size: "lg" })} href="/signup">
              Create workspace
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href="/login"
            >
              Log in
            </Link>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Current build</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {foundationItems.map((item) => (
                <div
                  className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">
              Still intentionally left for later: AI chatbot, document upload,
              vector search, quizzes, meeting transcription, billing, and
              production analytics.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
