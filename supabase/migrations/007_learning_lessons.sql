create table if not exists public.onboarding_lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.onboarding_modules(id) on delete cascade,
  title text not null,
  content text,
  order_index integer not null default 1,
  estimated_minutes integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignment_id uuid not null references public.onboarding_assignments(id) on delete cascade,
  lesson_id uuid not null references public.onboarding_lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (assignment_id, lesson_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_modules_id_organization_id_key'
  ) then
    alter table public.onboarding_modules
    add constraint onboarding_modules_id_organization_id_key unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_assignments_id_organization_id_key'
  ) then
    alter table public.onboarding_assignments
    add constraint onboarding_assignments_id_organization_id_key unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_lessons_id_organization_id_key'
  ) then
    alter table public.onboarding_lessons
    add constraint onboarding_lessons_id_organization_id_key unique (id, organization_id);
  end if;
end $$;

alter table public.onboarding_lessons
drop constraint if exists onboarding_lessons_module_id_fkey;

alter table public.onboarding_lessons
drop constraint if exists onboarding_lessons_module_tenant_fkey;

alter table public.onboarding_lessons
add constraint onboarding_lessons_module_tenant_fkey
foreign key (module_id, organization_id)
references public.onboarding_modules(id, organization_id)
on delete cascade;

alter table public.lesson_completions
drop constraint if exists lesson_completions_assignment_id_fkey;

alter table public.lesson_completions
drop constraint if exists lesson_completions_assignment_tenant_fkey;

alter table public.lesson_completions
add constraint lesson_completions_assignment_tenant_fkey
foreign key (assignment_id, organization_id)
references public.onboarding_assignments(id, organization_id)
on delete cascade;

alter table public.lesson_completions
drop constraint if exists lesson_completions_lesson_id_fkey;

alter table public.lesson_completions
drop constraint if exists lesson_completions_lesson_tenant_fkey;

alter table public.lesson_completions
add constraint lesson_completions_lesson_tenant_fkey
foreign key (lesson_id, organization_id)
references public.onboarding_lessons(id, organization_id)
on delete cascade;

alter table public.lesson_completions
drop constraint if exists lesson_completions_user_id_fkey;

alter table public.lesson_completions
drop constraint if exists lesson_completions_member_tenant_fkey;

alter table public.lesson_completions
add constraint lesson_completions_member_tenant_fkey
foreign key (user_id, organization_id)
references public.memberships(user_id, organization_id)
on delete cascade;

create index if not exists onboarding_lessons_module_id_idx
on public.onboarding_lessons(module_id);

create index if not exists lesson_completions_assignment_id_idx
on public.lesson_completions(assignment_id);

create index if not exists lesson_completions_user_id_idx
on public.lesson_completions(user_id);

drop trigger if exists set_onboarding_lessons_updated_at on public.onboarding_lessons;
create trigger set_onboarding_lessons_updated_at
before update on public.onboarding_lessons
for each row execute function public.set_updated_at();

alter table public.onboarding_lessons enable row level security;
alter table public.lesson_completions enable row level security;

drop policy if exists "Members can read onboarding lessons in their organizations" on public.onboarding_lessons;
create policy "Members can read onboarding lessons in their organizations"
on public.onboarding_lessons
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins and managers can create onboarding lessons" on public.onboarding_lessons;
create policy "Admins and managers can create onboarding lessons"
on public.onboarding_lessons
for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Admins and managers can update onboarding lessons" on public.onboarding_lessons;
create policy "Admins and managers can update onboarding lessons"
on public.onboarding_lessons
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Users and managers can read lesson completions" on public.lesson_completions;
create policy "Users and managers can read lesson completions"
on public.lesson_completions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);

drop policy if exists "Users can create their own lesson completions" on public.lesson_completions;
create policy "Users can create their own lesson completions"
on public.lesson_completions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);
