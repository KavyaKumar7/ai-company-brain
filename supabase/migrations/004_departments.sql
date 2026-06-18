create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

alter table public.memberships
add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists departments_organization_id_idx
on public.departments(organization_id);

create index if not exists memberships_department_id_idx
on public.memberships(department_id);

drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

alter table public.departments enable row level security;

drop policy if exists "Members can read departments in their organizations" on public.departments;
create policy "Members can read departments in their organizations"
on public.departments
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins can create departments in their organizations" on public.departments;
create policy "Admins can create departments in their organizations"
on public.departments
for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin']::public.app_role[]));

drop policy if exists "Admins can update departments in their organizations" on public.departments;
create policy "Admins can update departments in their organizations"
on public.departments
for update
to authenticated
using (public.has_org_role(organization_id, array['admin']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin']::public.app_role[]));

drop policy if exists "Admins can delete departments in their organizations" on public.departments;
create policy "Admins can delete departments in their organizations"
on public.departments
for delete
to authenticated
using (public.has_org_role(organization_id, array['admin']::public.app_role[]));
