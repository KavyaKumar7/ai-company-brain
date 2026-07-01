import type { ReactNode } from "react";
import Link from "next/link";
import { BrainCircuit, CheckCircle2, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(oklch(1_0_0/3%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/3%)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/15">
              <BrainCircuit className="size-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-sidebar-foreground">AI Company Brain</span>
              <span className="block text-[11px] text-sidebar-foreground/45">Workforce enablement platform</span>
            </span>
          </Link>

          <div className="mt-24 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-medium text-blue-200">
              <Sparkles className="size-3.5" />
              Verified knowledge, ready for work
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.12] tracking-normal text-sidebar-foreground xl:text-5xl">
              Give every employee a trusted place to learn and ask.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-sidebar-foreground/52">
              Turn approved company documents into cited answers, structured onboarding, and clear training progress.
            </p>

            <div className="mt-10 grid gap-3">
              {[
                { icon: FileCheck2, text: "Answers grounded in approved sources" },
                { icon: ShieldCheck, text: "Company data isolated by workspace" },
                { icon: CheckCircle2, text: "Human review stays in control" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex items-center gap-3 text-sm text-sidebar-foreground/72" key={item.text}>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-400/[0.08] text-emerald-300">
                      <Icon className="size-3.5" />
                    </span>
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-sidebar-foreground/35">
          Built for onboarding, knowledge, and workforce clarity.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrainCircuit className="size-[18px]" />
            </span>
            <span className="text-sm font-semibold">AI Company Brain</span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
