create or replace function public.accept_organization_invite(invite_token text)
returns table (
  organization_id uuid,
  accepted_role public.app_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.organization_invites%rowtype;
  current_user_email text;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to accept an invite.';
  end if;

  current_user_email := lower(coalesce(auth.jwt()->>'email', ''));

  select *
  into invite_row
  from public.organization_invites
  where token = invite_token
  for update;

  if invite_row.id is null then
    raise exception 'Invite not found.';
  end if;

  if invite_row.status <> 'pending' then
    raise exception 'Invite is no longer pending.';
  end if;

  if invite_row.expires_at <= now() then
    update public.organization_invites
    set status = 'expired'
    where id = invite_row.id;

    raise exception 'Invite has expired.';
  end if;

  if lower(invite_row.email) <> current_user_email then
    raise exception 'This invite was sent to a different email address.';
  end if;

  insert into public.memberships (organization_id, user_id, role, status)
  values (invite_row.organization_id, auth.uid(), invite_row.role, 'active')
  on conflict (organization_id, user_id)
  do update set
    role = excluded.role,
    status = 'active',
    updated_at = now();

  update public.organization_invites
  set status = 'accepted'
  where id = invite_row.id;

  organization_id := invite_row.organization_id;
  accepted_role := invite_row.role;
  return next;
end;
$$;

grant execute on function public.accept_organization_invite(text) to authenticated;

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
  invite_token text;
  invite_row public.organization_invites%rowtype;
begin
  invite_token := nullif(trim(new.raw_user_meta_data->>'invite_token'), '');
  organization_name := nullif(trim(new.raw_user_meta_data->>'organization_name'), '');

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  );

  if invite_token is not null then
    select *
    into invite_row
    from public.organization_invites
    where token = invite_token
    for update;

    if invite_row.id is not null
      and invite_row.status = 'pending'
      and invite_row.expires_at > now()
      and lower(invite_row.email) = lower(coalesce(new.email, ''))
    then
      insert into public.memberships (organization_id, user_id, role, status)
      values (invite_row.organization_id, new.id, invite_row.role, 'active')
      on conflict (organization_id, user_id)
      do update set
        role = excluded.role,
        status = 'active',
        updated_at = now();

      update public.organization_invites
      set status = 'accepted'
      where id = invite_row.id;

      return new;
    end if;
  end if;

  if organization_name is null then
    organization_name := 'Personal workspace';
  end if;

  organization_slug := public.slugify(organization_name) || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug, created_by)
  values (organization_name, organization_slug, new.id)
  returning id into new_organization_id;

  insert into public.memberships (organization_id, user_id, role, status)
  values (new_organization_id, new.id, 'admin', 'active');

  return new;
end;
$$;
