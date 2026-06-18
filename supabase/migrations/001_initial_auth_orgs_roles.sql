create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'manager', 'employee');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'employee',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  constraint memberships_status_check check (status in ('active', 'invited', 'disabled'))
);

create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists memberships_organization_id_idx on public.memberships(organization_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_memberships_updated_at on public.memberships;
create trigger set_memberships_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(
    both '-' from regexp_replace(
      regexp_replace(lower(coalesce(value, 'workspace')), '[^a-z0-9]+', '-', 'g'),
      '-+',
      '-',
      'g'
    )
  );
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where organization_id = target_org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_org_role(
  target_org_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where organization_id = target_org_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_name text;
  organization_slug text;
  new_organization_id uuid;
begin
  organization_name := nullif(trim(new.raw_user_meta_data->>'organization_name'), '');

  if organization_name is null then
    organization_name := 'Personal workspace';
  end if;

  organization_slug := public.slugify(organization_name) || '-' || substr(new.id::text, 1, 8);

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  );

  insert into public.organizations (name, slug, created_by)
  values (organization_name, organization_slug, new.id)
  returning id into new_organization_id;

  insert into public.memberships (organization_id, user_id, role, status)
  values (new_organization_id, new.id, 'admin', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;

drop policy if exists "Profiles are readable by the profile owner" on public.profiles;
create policy "Profiles are readable by the profile owner"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Profiles are editable by the profile owner" on public.profiles;
create policy "Profiles are editable by the profile owner"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "Admins can update their organizations" on public.organizations;
create policy "Admins can update their organizations"
on public.organizations
for update
to authenticated
using (public.has_org_role(id, array['admin']::public.app_role[]))
with check (public.has_org_role(id, array['admin']::public.app_role[]));

drop policy if exists "Members can read memberships in their organizations" on public.memberships;
create policy "Members can read memberships in their organizations"
on public.memberships
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins can manage memberships in their organizations" on public.memberships;
create policy "Admins can manage memberships in their organizations"
on public.memberships
for all
to authenticated
using (public.has_org_role(organization_id, array['admin']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin']::public.app_role[]));
