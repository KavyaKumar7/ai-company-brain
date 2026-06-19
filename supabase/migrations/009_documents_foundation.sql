insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-documents',
  'company-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
on conflict (id) do nothing;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  owner_user_id uuid not null references public.profiles(id),
  department_id uuid references public.departments(id) on delete set null,
  version integer not null default 1,
  effective_date date,
  review_date date,
  confidentiality text not null default 'internal',
  tags text[] not null default '{}',
  status text not null default 'ready_for_review',
  summary text,
  ai_suggestions_json jsonb not null default '{}'::jsonb,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_status_check check (
    status in ('processing', 'ready_for_review', 'approved', 'outdated', 'archived', 'failed')
  ),
  constraint documents_confidentiality_check check (
    confidentiality in ('public', 'internal', 'restricted')
  )
);

create index if not exists documents_organization_id_idx
on public.documents(organization_id);

create index if not exists documents_department_id_idx
on public.documents(department_id);

create index if not exists documents_status_idx
on public.documents(status);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "Members can read documents in their organizations"
on public.documents;
create policy "Members can read documents in their organizations"
on public.documents
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins and managers can create documents"
on public.documents;
create policy "Admins and managers can create documents"
on public.documents
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[])
);

drop policy if exists "Admins and managers can update documents"
on public.documents;
create policy "Admins and managers can update documents"
on public.documents
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Members can read document files in their organizations"
on storage.objects;
create policy "Members can read document files in their organizations"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'company-documents'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Admins and managers can upload document files"
on storage.objects;
create policy "Admins and managers can upload document files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-documents'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['admin', 'manager']::public.app_role[]
  )
);

drop policy if exists "Admins and managers can update document files"
on storage.objects;
create policy "Admins and managers can update document files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-documents'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['admin', 'manager']::public.app_role[]
  )
)
with check (
  bucket_id = 'company-documents'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['admin', 'manager']::public.app_role[]
  )
);
