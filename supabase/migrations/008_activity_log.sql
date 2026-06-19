create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_organization_id_created_at_idx
on public.activity_log(organization_id, created_at desc);

create index if not exists activity_log_user_id_idx
on public.activity_log(user_id);

alter table public.activity_log enable row level security;

drop policy if exists "Members can read activity logs in their organizations"
on public.activity_log;
create policy "Members can read activity logs in their organizations"
on public.activity_log
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can create activity logs in their organizations"
on public.activity_log;
create policy "Members can create activity logs in their organizations"
on public.activity_log
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);
