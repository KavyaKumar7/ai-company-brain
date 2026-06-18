# Decisions

## Day 1 foundation

- Use Supabase Auth and Supabase Postgres with RLS for tenant isolation.
- Create one organization during signup and make the signing-up user its `admin`.
- Keep the initial product surface limited to signup, login, logout, role-aware org context, and a protected dashboard.
- Store organization creation in the `handle_new_user` database trigger so the flow still works when email confirmation is enabled.
- Defer invitations, departments, activity logs, AI, uploads, pgvector, onboarding, quizzes, meeting transcription, billing, analytics, and exports.
