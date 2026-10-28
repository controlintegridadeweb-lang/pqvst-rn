-- Políticas para Supabase Auth. Não executar em PostgreSQL sem o schema auth.
-- service_role ignora RLS e é o único caminho previsto para gravar respostas e indicadores.
-- Nenhum papel de aplicação recebe leitura de survey_answers.

alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table organization_memberships enable row level security;
alter table survey_axes enable row level security;
alter table questionnaires enable row level security;
alter table questionnaire_versions enable row level security;
alter table survey_questions enable row level security;
alter table question_options enable row level security;
alter table survey_cycles enable row level security;
alter table cycle_organizations enable row level security;
alter table eligible_populations enable row level security;
alter table participation_credentials enable row level security;
alter table survey_submissions enable row level security;
alter table survey_answers enable row level security;
alter table indicator_results enable row level security;
alter table publication_records enable row level security;
alter table aggregate_snapshots enable row level security;
alter table action_plans enable row level security;
alter table action_items enable row level security;
alter table action_updates enable row level security;
alter table audit_logs enable row level security;

revoke all on survey_answers from anon, authenticated;
revoke all on survey_submissions from anon, authenticated;
revoke all on participation_credentials from anon, authenticated;

create or replace function app_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from user_profiles where id = auth.uid();
$$;

create or replace function app_belongs_to(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_memberships
    where user_id = auth.uid()
      and organization_id = target
      and status = 'active'
  );
$$;

revoke all on function app_current_role() from public;
revoke all on function app_belongs_to(uuid) from public;
grant execute on function app_current_role() to authenticated;
grant execute on function app_belongs_to(uuid) to authenticated;

create policy axes_are_public on survey_axes
  for select to anon, authenticated
  using (true);

create policy own_or_admin_profile on user_profiles
  for select to authenticated
  using (id = auth.uid() or app_current_role() = 'state_admin');

create policy read_memberships on organization_memberships
  for select to authenticated
  using (user_id = auth.uid() or app_current_role() = 'state_admin');

create policy read_organizations on organizations
  for select to authenticated
  using (app_current_role() = 'state_admin' or app_belongs_to(id));

create policy admin_reads_questionnaires on questionnaires
  for select to authenticated
  using (app_current_role() = 'state_admin');

create policy admin_reads_versions on questionnaire_versions
  for select to authenticated
  using (app_current_role() = 'state_admin');

create policy admin_reads_questions on survey_questions
  for select to authenticated
  using (app_current_role() = 'state_admin');

create policy admin_reads_options on question_options
  for select to authenticated
  using (app_current_role() = 'state_admin');

create policy admin_reads_cycles on survey_cycles
  for select to authenticated
  using (app_current_role() = 'state_admin' or exists (
    select 1 from cycle_organizations
    where cycle_organizations.cycle_id = survey_cycles.id
      and app_belongs_to(cycle_organizations.organization_id)
  ));

create policy read_cycle_links on cycle_organizations
  for select to authenticated
  using (app_current_role() = 'state_admin' or app_belongs_to(organization_id));

create policy read_eligible_counts on eligible_populations
  for select to authenticated
  using (app_current_role() = 'state_admin' or app_belongs_to(organization_id));

create policy read_admin_indicators on indicator_results
  for select to authenticated
  using (
    app_current_role() = 'state_admin'
    or (organization_id is not null and app_belongs_to(organization_id))
  );

create or replace function app_snapshot_is_public(publication uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from publication_records
    where id = publication
      and status = 'published'
      and revoked_at is null
  );
$$;

revoke all on function app_snapshot_is_public(uuid) from public;
grant execute on function app_snapshot_is_public(uuid) to anon, authenticated;

create policy read_published_snapshots on aggregate_snapshots
  for select to anon, authenticated
  using (suppressed = false and app_snapshot_is_public(publication_id));

create policy read_own_actions on action_items
  for select to authenticated
  using (app_current_role() = 'state_admin' or app_belongs_to(organization_id));

create policy insert_own_actions on action_items
  for insert to authenticated
  with check (
    status = 'not_started'
    and public_disclosure = false
    and app_belongs_to(organization_id)
  );

create policy read_action_plans on action_plans
  for select to authenticated
  using (app_current_role() = 'state_admin' or app_belongs_to(organization_id));

create policy read_action_updates on action_updates
  for select to authenticated
  using (
    exists (
      select 1 from action_items
      where action_items.id = action_updates.action_item_id
        and (app_current_role() = 'state_admin' or app_belongs_to(action_items.organization_id))
    )
  );

create policy admin_reads_audit on audit_logs
  for select to authenticated
  using (app_current_role() = 'state_admin');

comment on policy read_published_snapshots on aggregate_snapshots is
  'Visitante e servidor autenticado leem somente agregado publicado e não suprimido.';
