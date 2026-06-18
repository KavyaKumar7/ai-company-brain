alter table public.departments
add constraint departments_id_organization_id_key unique (id, organization_id);

alter table public.onboarding_paths
add constraint onboarding_paths_id_organization_id_key unique (id, organization_id);

alter table public.memberships
add constraint memberships_user_id_organization_id_key unique (user_id, organization_id);

alter table public.memberships
drop constraint if exists memberships_department_id_fkey;

alter table public.memberships
add constraint memberships_department_tenant_fkey
foreign key (department_id, organization_id)
references public.departments(id, organization_id)
on delete set null (department_id);

alter table public.onboarding_paths
drop constraint if exists onboarding_paths_department_id_fkey;

alter table public.onboarding_paths
add constraint onboarding_paths_department_tenant_fkey
foreign key (department_id, organization_id)
references public.departments(id, organization_id)
on delete set null (department_id);

alter table public.onboarding_modules
drop constraint if exists onboarding_modules_path_id_fkey;

alter table public.onboarding_modules
add constraint onboarding_modules_path_tenant_fkey
foreign key (path_id, organization_id)
references public.onboarding_paths(id, organization_id)
on delete cascade;

alter table public.onboarding_assignments
drop constraint if exists onboarding_assignments_path_id_fkey;

alter table public.onboarding_assignments
add constraint onboarding_assignments_path_tenant_fkey
foreign key (path_id, organization_id)
references public.onboarding_paths(id, organization_id)
on delete cascade;

alter table public.onboarding_assignments
drop constraint if exists onboarding_assignments_user_id_fkey;

alter table public.onboarding_assignments
add constraint onboarding_assignments_member_tenant_fkey
foreign key (user_id, organization_id)
references public.memberships(user_id, organization_id)
on delete cascade;
