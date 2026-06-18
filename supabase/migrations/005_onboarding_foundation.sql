create table if not exists public.onboarding_paths (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  target_role public.app_role not null default 'employee',
  department_id uuid references public.departments(id) on delete set null,
  status text not null default 'draft',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_paths_status_check check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.onboarding_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  path_id uuid not null references public.onboarding_paths(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 1,
  estimated_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  path_id uuid not null references public.onboarding_paths(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  due_date date,
  status text not null default 'assigned',
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (path_id, user_id),
  constraint onboarding_assignments_status_check check (status in ('assigned', 'in_progress', 'completed', 'cancelled'))
);

create index if not exists onboarding_paths_organization_id_idx
on public.onboarding_paths(organization_id);

create index if not exists onboarding_paths_department_id_idx
on public.onboarding_paths(department_id);

create index if not exists onboarding_modules_path_id_idx
on public.onboarding_modules(path_id);

create index if not exists onboarding_assignments_user_id_idx
on public.onboarding_assignments(user_id);

drop trigger if exists set_onboarding_paths_updated_at on public.onboarding_paths;
create trigger set_onboarding_paths_updated_at
before update on public.onboarding_paths
for each row execute function public.set_updated_at();

drop trigger if exists set_onboarding_modules_updated_at on public.onboarding_modules;
create trigger set_onboarding_modules_updated_at
before update on public.onboarding_modules
for each row execute function public.set_updated_at();

alter table public.onboarding_paths enable row level security;
alter table public.onboarding_modules enable row level security;
alter table public.onboarding_assignments enable row level security;

drop policy if exists "Members can read onboarding paths in their organizations" on public.onboarding_paths;
create policy "Members can read onboarding paths in their organizations"
on public.onboarding_paths
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins and managers can create onboarding paths" on public.onboarding_paths;
create policy "Admins and managers can create onboarding paths"
on public.onboarding_paths
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);

drop policy if exists "Admins and managers can update onboarding paths" on public.onboarding_paths;
create policy "Admins and managers can update onboarding paths"
on public.onboarding_paths
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Members can read onboarding modules in their organizations" on public.onboarding_modules;
create policy "Members can read onboarding modules in their organizations"
on public.onboarding_modules
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins and managers can create onboarding modules" on public.onboarding_modules;
create policy "Admins and managers can create onboarding modules"
on public.onboarding_modules
for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Admins and managers can update onboarding modules" on public.onboarding_modules;
create policy "Admins and managers can update onboarding modules"
on public.onboarding_modules
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Users can read their onboarding assignments" on public.onboarding_assignments;
create policy "Users can read their onboarding assignments"
on public.onboarding_assignments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);

drop policy if exists "Admins and managers can create onboarding assignments" on public.onboarding_assignments;
create policy "Admins and managers can create onboarding assignments"
on public.onboarding_assignments
for insert
to authenticated
with check (
  assigned_by = auth.uid()
  and public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);

drop policy if exists "Admins and managers can update onboarding assignments" on public.onboarding_assignments;
create policy "Admins and managers can update onboarding assignments"
on public.onboarding_assignments
for update
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
)
with check (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);
