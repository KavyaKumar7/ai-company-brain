create extension if not exists vector;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  page integer,
  section text,
  embedding vector(1536),
  token_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists document_chunks_organization_id_idx
on public.document_chunks(organization_id);

create index if not exists document_chunks_document_id_idx
on public.document_chunks(document_id);

create index if not exists document_chunks_embedding_idx
on public.document_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100)
where embedding is not null;

alter table public.document_chunks enable row level security;

drop policy if exists "Members can read document chunks in their organizations"
on public.document_chunks;
create policy "Members can read document chunks in their organizations"
on public.document_chunks
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Admins and managers can create document chunks"
on public.document_chunks;
create policy "Admins and managers can create document chunks"
on public.document_chunks
for insert
to authenticated
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Admins and managers can update document chunks"
on public.document_chunks;
create policy "Admins and managers can update document chunks"
on public.document_chunks
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Admins and managers can delete document chunks"
on public.document_chunks;
create policy "Admins and managers can delete document chunks"
on public.document_chunks
for delete
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));
