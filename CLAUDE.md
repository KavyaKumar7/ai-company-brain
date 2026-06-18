# Project conventions

- Stack: Next.js App Router, TypeScript, Supabase Auth, Supabase Postgres, Tailwind CSS, shadcn/ui, Vercel.
- Tenancy is sacred: every tenant-owned table must have `organization_id`.
- Never trust roles from the client. Load role and organization context from the server session.
- Do not query organization data directly in routes or components. Use `src/lib/data-access`.
- Every data-access function touching tenant data must be scoped by `orgId`.
- RLS is the database backstop, not the only guard. Keep app-level org scoping too.
- Do not add AI, document upload, storage, pgvector, onboarding, quiz, meeting, billing, or analytics code until explicitly requested.
- Never put API keys or service-role secrets in client code.
- Before finishing a task, list changed files and flag security-sensitive code.
