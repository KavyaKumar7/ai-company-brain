import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <section className="w-full max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          AI Company Brain
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Secure company workspaces for workforce enablement.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Day 1 foundation: authentication, organization workspaces, roles, and
          a protected dashboard. AI, uploads, and training flows come later.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </section>
    </main>
  );
}
