create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'employee',
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint organization_invites_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists organization_invites_organization_id_idx
on public.organization_invites(organization_id);

create index if not exists organization_invites_email_idx
on public.organization_invites(lower(email));

create or replace function public.can_read_profile(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select auth.uid() = target_user_id
    or exists (
      select 1
      from public.memberships viewer_membership
      join public.memberships target_membership
        on target_membership.organization_id = viewer_membership.organization_id
      where viewer_membership.user_id = auth.uid()
        and viewer_membership.status = 'active'
        and target_membership.user_id = target_user_id
        and target_membership.status = 'active'
    );
$$;

alter table public.organization_invites enable row level security;

drop policy if exists "Profiles are readable by owner or organization members" on public.profiles;
create policy "Profiles are readable by owner or organization members"
on public.profiles
for select
to authenticated
using (public.can_read_profile(id));

drop policy if exists "Admins can read invites in their organizations" on public.organization_invites;
create policy "Admins can read invites in their organizations"
on public.organization_invites
for select
to authenticated
using (public.has_org_role(organization_id, array['admin']::public.app_role[]));

drop policy if exists "Admins can create invites in their organizations" on public.organization_invites;
create policy "Admins can create invites in their organizations"
on public.organization_invites
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(organization_id, array['admin']::public.app_role[])
);

drop policy if exists "Admins can update invites in their organizations" on public.organization_invites;
create policy "Admins can update invites in their organizations"
on public.organization_invites
for update
to authenticated
using (public.has_org_role(organization_id, array['admin']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin']::public.app_role[]));
