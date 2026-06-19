create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  cited_chunk_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant'))
);

create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint answer_feedback_rating_check check (rating in ('helpful', 'incorrect', 'outdated'))
);

create table if not exists public.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question text not null,
  frequency integer not null default 1,
  status text not null default 'open',
  assigned_owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_gaps_status_check check (status in ('open', 'assigned', 'resolved'))
);

create index if not exists conversations_organization_id_user_id_idx
on public.conversations(organization_id, user_id);

create index if not exists messages_conversation_id_created_at_idx
on public.messages(conversation_id, created_at);

create index if not exists answer_feedback_message_id_idx
on public.answer_feedback(message_id);

create index if not exists knowledge_gaps_organization_id_status_idx
on public.knowledge_gaps(organization_id, status);

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists set_knowledge_gaps_updated_at on public.knowledge_gaps;
create trigger set_knowledge_gaps_updated_at
before update on public.knowledge_gaps
for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.answer_feedback enable row level security;
alter table public.knowledge_gaps enable row level security;

drop policy if exists "Users can read their conversations" on public.conversations;
create policy "Users can read their conversations"
on public.conversations
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Users can create their conversations" on public.conversations;
create policy "Users can create their conversations"
on public.conversations
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Users can update their conversations" on public.conversations;
create policy "Users can update their conversations"
on public.conversations
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
)
with check (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Users can read their conversation messages" on public.messages;
create policy "Users can read their conversation messages"
on public.messages
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

drop policy if exists "Users can create messages in their conversations" on public.messages;
create policy "Users can create messages in their conversations"
on public.messages
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
  )
);

drop policy if exists "Users can read their answer feedback" on public.answer_feedback;
create policy "Users can read their answer feedback"
on public.answer_feedback
for select
to authenticated
using (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Users can create their answer feedback" on public.answer_feedback;
create policy "Users can create their answer feedback"
on public.answer_feedback
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Admins and managers can read knowledge gaps" on public.knowledge_gaps;
create policy "Admins and managers can read knowledge gaps"
on public.knowledge_gaps
for select
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Members can create knowledge gaps" on public.knowledge_gaps;
create policy "Members can create knowledge gaps"
on public.knowledge_gaps
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_org_member(organization_id)
);

drop policy if exists "Admins and managers can update knowledge gaps" on public.knowledge_gaps;
create policy "Admins and managers can update knowledge gaps"
on public.knowledge_gaps
for update
to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));
