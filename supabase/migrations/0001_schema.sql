-- PQVST / PIC-RN
-- Esquema inicial para Supabase/PostgreSQL.
-- Não contém perguntas oficiais nem resultados de diagnóstico.
-- A vigência das normas citadas deve ser conferida em fonte oficial antes da produção.

create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  acronym text not null,
  participation text not null check (participation in ('active', 'suspended', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (acronym)
);

create table user_profiles (
  id uuid primary key,
  full_name text not null,
  role text not null check (role in ('state_admin', 'org_manager')),
  created_at timestamptz not null default now()
);

comment on table user_profiles is
  'Em Supabase, id deve corresponder a auth.users. A chave estrangeira fica na migration específica do provedor.';

create table organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  seat text not null check (seat in ('titular', 'suplente', 'member')),
  status text not null check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create table survey_axes (
  id uuid primary key,
  code text not null unique check (code in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6')),
  name text not null,
  description text not null,
  sort_order integer not null unique check (sort_order between 1 and 6)
);

insert into survey_axes (id, code, name, description, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'E1', 'Promoção da Saúde e Segurança no Trabalho', 'Abrange questões relacionadas ao bem-estar físico, mental e social, condições de trabalho, ergonomia e segurança.', 1),
  ('00000000-0000-4000-8000-000000000002', 'E2', 'Desenvolvimento de Pessoas', 'Abrange desenvolvimento profissional, capacitação, valorização, reconhecimento e oportunidades de crescimento.', 2),
  ('00000000-0000-4000-8000-000000000003', 'E3', 'Lazer e Vida Social', 'Abrange convivência, integração, relações interpessoais, descanso e bem-estar social.', 3),
  ('00000000-0000-4000-8000-000000000004', 'E4', 'Práticas de Gestão do Trabalho', 'Abrange gestão participativa, comunicação, humanização, organização do trabalho e relações institucionais.', 4),
  ('00000000-0000-4000-8000-000000000005', 'E5', 'Cultura Prevencionista', 'Abrange prevenção de riscos, segurança, conscientização e práticas institucionais preventivas.', 5),
  ('00000000-0000-4000-8000-000000000006', 'E6', 'Preservação e Sustentabilidade', 'Abrange consumo consciente, práticas sustentáveis e responsabilidade ambiental no ambiente institucional.', 6);

create table questionnaires (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id),
  version_number integer not null check (version_number > 0),
  version_label text not null,
  status text not null check (status in ('draft', 'in_review', 'approved', 'retired')),
  origin text not null check (origin = 'official_import'),
  source_document text not null,
  source_url text,
  methodology_id text not null,
  created_at timestamptz not null default now(),
  unique (questionnaire_id, version_number)
);

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null references questionnaire_versions(id),
  axis_id uuid references survey_axes(id),
  code text not null,
  prompt text not null,
  section_label text,
  sort_order integer not null check (sort_order > 0),
  required boolean not null,
  scale text not null check (scale in ('satisfaction', 'frequency', 'agreement', 'open_text', 'single_choice')),
  scoring text not null check (scoring in ('scoreable_positive', 'not_scoreable', 'negative_pending_homologation')),
  unique (questionnaire_version_id, code),
  unique (questionnaire_version_id, sort_order),
  check (
    (scoring = 'scoreable_positive' and axis_id is not null and scale in ('satisfaction', 'frequency', 'agreement'))
    or (scoring = 'negative_pending_homologation' and axis_id is not null and scale in ('satisfaction', 'frequency', 'agreement'))
    or (scoring = 'not_scoreable' and scale in ('open_text', 'single_choice', 'satisfaction', 'frequency', 'agreement'))
  )
);

comment on column survey_questions.scoring is
  'Item negativo não tem a pontuação invertida. Ele permanece fora do IQVST até regra homologada.';

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references survey_questions(id) on delete cascade,
  value smallint not null check (value between 1 and 5),
  label text not null,
  unique (question_id, value)
);

create table survey_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reference_period text not null,
  opens_on date not null,
  closes_on date not null,
  questionnaire_version_id uuid not null references questionnaire_versions(id),
  status text not null check (status in ('draft', 'scheduled', 'open', 'closed', 'processed', 'published')),
  methodology_id text not null,
  created_at timestamptz not null default now(),
  check (closes_on >= opens_on)
);

create table cycle_organizations (
  cycle_id uuid not null references survey_cycles(id),
  organization_id uuid not null references organizations(id),
  participation text not null check (participation in ('invited', 'active', 'declined')),
  primary key (cycle_id, organization_id)
);

create table eligible_populations (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references survey_cycles(id),
  organization_id uuid not null references organizations(id),
  headcount integer not null check (headcount > 0),
  source_note text not null,
  recorded_at timestamptz not null default now(),
  unique (cycle_id, organization_id)
);

comment on table eligible_populations is
  'Quantitativo institucional para taxa de participação. Não armazena lista de servidores.';

create table participation_credentials (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references survey_cycles(id),
  organization_id uuid not null references organizations(id),
  token_hash text not null unique,
  status text not null check (status in ('issued', 'consumed', 'revoked', 'expired')),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'consumed') = (consumed_at is not null))
);

comment on table participation_credentials is
  'Não possui vínculo com survey_submissions. O token puro não é armazenado. Correlação temporal residual permanece possível para quem administra o banco.';

create table survey_submissions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references survey_cycles(id),
  organization_id uuid not null references organizations(id),
  questionnaire_version_id uuid not null references questionnaire_versions(id),
  submitted_at timestamptz not null default now()
);

comment on table survey_submissions is
  'Sem usuário, CPF, matrícula, e-mail, IP ou credencial. Não ligar esta tabela à participação.';

create table survey_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references survey_submissions(id) on delete restrict,
  question_id uuid not null references survey_questions(id),
  numeric_value smallint,
  text_value text,
  unique (submission_id, question_id),
  check (numeric_value is null or numeric_value between 1 and 5),
  check ((numeric_value is not null and text_value is null) or (numeric_value is null and text_value is not null)),
  check (text_value is null or char_length(text_value) <= 2000)
);

comment on table survey_answers is
  'Retenção e descarte dependem de política institucional ainda não homologada. Não apagar por prazo inventado.';

create table indicator_results (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references survey_cycles(id),
  organization_id uuid references organizations(id),
  organization_name text,
  axis_code text check (axis_code in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6')),
  metric text not null check (metric in ('iqvst', 'axis_mean', 'response_count')),
  value numeric(8, 4),
  response_count integer not null check (response_count >= 0),
  classification text,
  methodology_id text not null,
  strategy_id text not null,
  created_at timestamptz not null default now(),
  check ((organization_id is null) = (organization_name is null))
);

comment on table indicator_results is
  'Resultado administrativo. Pode conter grupo pequeno para gestão da participação, sem resposta individual.';

create table publication_records (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references survey_cycles(id),
  status text not null check (status in ('draft', 'published', 'revoked')),
  methodology_id text not null,
  strategy_id text not null,
  disclosure_threshold integer not null check (disclosure_threshold >= 2),
  public_note text,
  published_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  published_by uuid references user_profiles(id),
  check ((status = 'published') = (published_at is not null and revoked_at is null)),
  check ((status = 'revoked') = (revoked_at is not null and revocation_reason is not null))
);

create table aggregate_snapshots (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publication_records(id),
  cycle_id uuid not null references survey_cycles(id),
  cycle_name text not null,
  organization_id uuid references organizations(id),
  organization_name text,
  axis_code text check (axis_code in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6')),
  metric text not null check (metric in ('iqvst', 'axis_mean', 'response_count')),
  value numeric(8, 4),
  response_count integer check (response_count is null or response_count >= 0),
  classification text,
  suppressed boolean not null,
  suppression_reason text check (suppression_reason in ('primary', 'complementary')),
  methodology_id text not null,
  created_at timestamptz not null default now(),
  check ((organization_id is null) = (organization_name is null)),
  check (suppressed = false or value is null),
  check ((suppressed = true) = (suppression_reason is not null))
);

comment on table aggregate_snapshots is
  'Única fonte prevista para o painel público. Não consultar survey_answers a partir da interface pública.';

create table action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cycle_id uuid not null references survey_cycles(id),
  title text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, cycle_id)
);

create table action_items (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid not null references action_plans(id),
  organization_id uuid not null references organizations(id),
  cycle_id uuid not null references survey_cycles(id),
  axis_code text not null check (axis_code in ('E1', 'E2', 'E3', 'E4', 'E5', 'E6')),
  problem text not null,
  objective text not null,
  description text not null,
  institutional_owner text not null,
  due_date date not null,
  expected_result text not null,
  monitoring_indicator text,
  status text not null check (status in ('not_started', 'in_progress', 'completed', 'suspended', 'cancelled')),
  public_disclosure boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column action_items.monitoring_indicator is
  'Indicador de execução da ação. Não é o IQVST e não deve ser somado a ele.';

create table action_updates (
  id uuid primary key default gen_random_uuid(),
  action_item_id uuid not null references action_items(id),
  status text not null check (status in ('not_started', 'in_progress', 'completed', 'suspended', 'cancelled')),
  note text not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references user_profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

comment on table audit_logs is
  'Não registrar resposta, texto aberto, token, CPF, matrícula ou e-mail de participante.';

create index survey_questions_version_idx on survey_questions (questionnaire_version_id);
create index survey_answers_submission_idx on survey_answers (submission_id);
create index submissions_cycle_org_idx on survey_submissions (cycle_id, organization_id);
create index credentials_cycle_org_idx on participation_credentials (cycle_id, organization_id, status);
create index snapshots_publication_idx on aggregate_snapshots (publication_id, suppressed);
create index indicator_results_scope_idx on indicator_results (cycle_id, organization_id);
create index audit_logs_created_idx on audit_logs (created_at);
