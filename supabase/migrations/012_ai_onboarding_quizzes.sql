alter table public.onboarding_lessons
add column if not exists lesson_type text not null default 'text',
add column if not exists source_document_ids uuid[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_lessons_type_check'
  ) then
    alter table public.onboarding_lessons
    add constraint onboarding_lessons_type_check
    check (lesson_type in ('text', 'quiz'));
  end if;
end $$;

create table if not exists public.onboarding_quizzes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lesson_id uuid not null,
  pass_score integer not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, organization_id),
  constraint onboarding_quizzes_pass_score_check check (pass_score between 1 and 100),
  constraint onboarding_quizzes_lesson_tenant_fkey
    foreign key (lesson_id, organization_id)
    references public.onboarding_lessons(id, organization_id)
    on delete cascade
);

create table if not exists public.onboarding_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quiz_id uuid not null,
  question_type text not null default 'multiple_choice',
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_quiz_questions_type_check
    check (question_type in ('multiple_choice', 'true_false')),
  constraint onboarding_quiz_questions_options_check
    check (jsonb_typeof(options) = 'array')
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_quizzes_id_organization_id_key'
  ) then
    alter table public.onboarding_quizzes
    add constraint onboarding_quizzes_id_organization_id_key
    unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_quiz_questions_quiz_tenant_fkey'
  ) then
    alter table public.onboarding_quiz_questions
    add constraint onboarding_quiz_questions_quiz_tenant_fkey
    foreign key (quiz_id, organization_id)
    references public.onboarding_quizzes(id, organization_id)
    on delete cascade;
  end if;
end $$;

create index if not exists onboarding_quizzes_lesson_id_idx
on public.onboarding_quizzes(lesson_id);

create index if not exists onboarding_quiz_questions_quiz_id_idx
on public.onboarding_quiz_questions(quiz_id);

drop trigger if exists set_onboarding_quizzes_updated_at on public.onboarding_quizzes;
create trigger set_onboarding_quizzes_updated_at
before update on public.onboarding_quizzes
for each row execute function public.set_updated_at();

drop trigger if exists set_onboarding_quiz_questions_updated_at on public.onboarding_quiz_questions;
create trigger set_onboarding_quiz_questions_updated_at
before update on public.onboarding_quiz_questions
for each row execute function public.set_updated_at();

alter table public.onboarding_quizzes enable row level security;
alter table public.onboarding_quiz_questions enable row level security;

drop policy if exists "Members can read onboarding quizzes" on public.onboarding_quizzes;
create policy "Members can read onboarding quizzes"
on public.onboarding_quizzes for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Managers can manage onboarding quizzes" on public.onboarding_quizzes;
create policy "Managers can manage onboarding quizzes"
on public.onboarding_quizzes for all to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

drop policy if exists "Members can read onboarding quiz questions" on public.onboarding_quiz_questions;
create policy "Members can read onboarding quiz questions"
on public.onboarding_quiz_questions for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Managers can manage onboarding quiz questions" on public.onboarding_quiz_questions;
create policy "Managers can manage onboarding quiz questions"
on public.onboarding_quiz_questions for all to authenticated
using (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]))
with check (public.has_org_role(organization_id, array['admin', 'manager']::public.app_role[]));

create or replace function public.create_generated_onboarding_path(
  p_organization_id uuid,
  p_created_by uuid,
  p_title text,
  p_target_role public.app_role,
  p_department_id uuid,
  p_source_document_ids uuid[],
  p_draft jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_path_id uuid;
  new_module_id uuid;
  new_lesson_id uuid;
  new_quiz_id uuid;
  module_record record;
  lesson_record record;
  question_record record;
  lesson_sources uuid[];
begin
  if auth.uid() is distinct from p_created_by
    or not public.has_org_role(
      p_organization_id,
      array['admin', 'manager']::public.app_role[]
    ) then
    raise exception 'Not authorized to generate onboarding paths';
  end if;

  if coalesce(array_length(p_source_document_ids, 1), 0) = 0 then
    raise exception 'At least one approved source document is required';
  end if;

  if exists (
    select 1
    from unnest(p_source_document_ids) source_id
    where not exists (
      select 1 from public.documents d
      where d.id = source_id
        and d.organization_id = p_organization_id
        and d.status = 'approved'
    )
  ) then
    raise exception 'Every source document must be approved and belong to the organization';
  end if;

  if jsonb_typeof(p_draft->'modules') is distinct from 'array'
    or jsonb_array_length(p_draft->'modules') = 0 then
    raise exception 'Generated path must contain at least one module';
  end if;

  insert into public.onboarding_paths (
    organization_id, title, description, target_role, department_id, status, created_by
  ) values (
    p_organization_id,
    p_title,
    nullif(trim(p_draft->>'description'), ''),
    p_target_role,
    p_department_id,
    'draft',
    p_created_by
  ) returning id into new_path_id;

  for module_record in
    select value, ordinality
    from jsonb_array_elements(p_draft->'modules') with ordinality
  loop
    insert into public.onboarding_modules (
      organization_id, path_id, title, description, order_index, estimated_minutes
    ) values (
      p_organization_id,
      new_path_id,
      module_record.value->>'title',
      nullif(trim(module_record.value->>'description'), ''),
      module_record.ordinality,
      greatest(5, least(240, coalesce((module_record.value->>'estimatedMinutes')::integer, 30)))
    ) returning id into new_module_id;

    for lesson_record in
      select value, ordinality
      from jsonb_array_elements(module_record.value->'lessons') with ordinality
    loop
      select coalesce(array_agg(source_id), p_source_document_ids)
      into lesson_sources
      from (
        select source_text.value::uuid as source_id
        from jsonb_array_elements_text(
          lesson_record.value->'sourceDocumentIds'
        ) as source_text(value)
        where source_text.value::uuid = any(p_source_document_ids)
      ) selected_sources;

      insert into public.onboarding_lessons (
        organization_id,
        module_id,
        title,
        content,
        order_index,
        estimated_minutes,
        lesson_type,
        source_document_ids
      ) values (
        p_organization_id,
        new_module_id,
        lesson_record.value->>'title',
        lesson_record.value->>'content',
        lesson_record.ordinality,
        greatest(2, least(90, coalesce((lesson_record.value->>'estimatedMinutes')::integer, 10))),
        'text',
        lesson_sources
      ) returning id into new_lesson_id;

      insert into public.onboarding_quizzes (
        organization_id, lesson_id, pass_score
      ) values (
        p_organization_id,
        new_lesson_id,
        greatest(1, least(100, coalesce((lesson_record.value->'quiz'->>'passScore')::integer, 80)))
      ) returning id into new_quiz_id;

      for question_record in
        select value, ordinality
        from jsonb_array_elements(lesson_record.value->'quiz'->'questions') with ordinality
      loop
        insert into public.onboarding_quiz_questions (
          organization_id,
          quiz_id,
          question_type,
          prompt,
          options,
          correct_answer,
          explanation,
          order_index
        ) values (
          p_organization_id,
          new_quiz_id,
          'multiple_choice',
          question_record.value->>'prompt',
          question_record.value->'options',
          question_record.value->>'correctAnswer',
          nullif(trim(question_record.value->>'explanation'), ''),
          question_record.ordinality
        );
      end loop;
    end loop;
  end loop;

  return new_path_id;
end;
$$;

grant execute on function public.create_generated_onboarding_path(
  uuid, uuid, text, public.app_role, uuid, uuid[], jsonb
) to authenticated;
