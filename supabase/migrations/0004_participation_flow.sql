-- Emissão e envio anônimo. Executar no Supabase, depois do esquema e do RLS.
-- service_role é o único papel que executa estas funções.
-- A resposta gravada não recebe o identificador da credencial.

create or replace function credential_balances(p_cycle_ids uuid[])
returns table (
  cycle_id uuid,
  organization_id uuid,
  total integer,
  available integer,
  consumed integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    participation_credentials.cycle_id,
    participation_credentials.organization_id,
    count(*)::integer,
    count(*) filter (where status = 'issued')::integer,
    count(*) filter (where status = 'consumed')::integer
  from participation_credentials
  where participation_credentials.cycle_id = any (p_cycle_ids)
  group by participation_credentials.cycle_id, participation_credentials.organization_id;
$$;

create or replace function issue_participation_credentials(
  p_cycle_id uuid,
  p_organization_id uuid,
  p_token_hashes text[]
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headcount integer;
  v_existing integer;
  v_hash text;
  v_inserted integer := 0;
  v_today date := (timezone('America/Fortaleza', now()))::date;
begin
  if p_token_hashes is null or cardinality(p_token_hashes) < 1 or cardinality(p_token_hashes) > 500 then
    raise exception 'invalid_batch';
  end if;

  if (
    select count(distinct hash_item)
    from unnest(p_token_hashes) as hash_item
  ) <> cardinality(p_token_hashes) then
    raise exception 'invalid_hash';
  end if;

  if not exists (
    select 1
    from survey_cycles
    where id = p_cycle_id
      and status = 'open'
      and v_today >= opens_on
      and v_today <= closes_on
  ) then
    raise exception 'cycle_closed';
  end if;

  if not exists (
    select 1
    from cycle_organizations
    where cycle_id = p_cycle_id
      and organization_id = p_organization_id
      and participation = 'active'
  ) then
    raise exception 'organization_not_in_cycle';
  end if;

  select headcount
    into v_headcount
  from eligible_populations
  where cycle_id = p_cycle_id
    and organization_id = p_organization_id
  for update;

  if v_headcount is null then
    raise exception 'headcount_missing';
  end if;

  select count(*)
    into v_existing
  from participation_credentials
  where cycle_id = p_cycle_id
    and organization_id = p_organization_id;

  if v_existing + cardinality(p_token_hashes) > v_headcount then
    raise exception 'headcount_exceeded';
  end if;

  foreach v_hash in array p_token_hashes loop
    if v_hash is null or char_length(v_hash) <> 64 or v_hash !~ '^[0-9a-f]+$' then
      raise exception 'invalid_hash';
    end if;
    insert into participation_credentials (cycle_id, organization_id, token_hash, status)
    values (p_cycle_id, p_organization_id, v_hash, 'issued');
    v_inserted := v_inserted + 1;
  end loop;

  return v_inserted;
end;
$$;

create or replace function submit_anonymous_response(
  p_credential_id uuid,
  p_answers jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cycle uuid;
  v_org uuid;
  v_status text;
  v_version uuid;
  v_submission uuid;
  v_question record;
  v_raw jsonb;
  v_numeric numeric;
  v_text text;
  v_today date := (timezone('America/Fortaleza', now()))::date;
begin
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'invalid_answers';
  end if;

  select cycle_id, organization_id, status
    into v_cycle, v_org, v_status
  from participation_credentials
  where id = p_credential_id
  for update;

  if not found or v_status <> 'issued' then
    raise exception 'credential_unavailable';
  end if;

  select questionnaire_version_id
    into v_version
  from survey_cycles
  where id = v_cycle
    and status = 'open'
    and v_today >= opens_on
    and v_today <= closes_on;

  if v_version is null then
    raise exception 'cycle_closed';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(p_answers) as answer_code
    where not exists (
      select 1
      from survey_questions
      where questionnaire_version_id = v_version
        and code = answer_code
    )
  ) then
    raise exception 'invalid_answers';
  end if;

  if exists (
    select 1
    from survey_questions
    where questionnaire_version_id = v_version
      and required
      and (p_answers -> code) is null
  ) then
    raise exception 'invalid_answers';
  end if;

  insert into survey_submissions (cycle_id, organization_id, questionnaire_version_id)
  values (v_cycle, v_org, v_version)
  returning id into v_submission;

  for v_question in
    select id, code, scale
    from survey_questions
    where questionnaire_version_id = v_version
      and (p_answers -> code) is not null
  loop
    v_raw := p_answers -> v_question.code;
    if jsonb_typeof(v_raw) = 'number' then
      if v_question.scale not in ('satisfaction', 'frequency', 'agreement') then
        raise exception 'invalid_answers';
      end if;
      v_numeric := (v_raw #>> '{}')::numeric;
      if v_numeric <> trunc(v_numeric) or v_numeric < 1 or v_numeric > 5 then
        raise exception 'invalid_answers';
      end if;
      insert into survey_answers (submission_id, question_id, numeric_value, text_value)
      values (v_submission, v_question.id, v_numeric::smallint, null);
    elsif jsonb_typeof(v_raw) = 'string' then
      if v_question.scale not in ('open_text', 'single_choice') then
        raise exception 'invalid_answers';
      end if;
      v_text := v_raw #>> '{}';
      if char_length(v_text) < 1 or char_length(v_text) > 2000 then
        raise exception 'invalid_answers';
      end if;
      insert into survey_answers (submission_id, question_id, numeric_value, text_value)
      values (v_submission, v_question.id, null, v_text);
    else
      raise exception 'invalid_answers';
    end if;
  end loop;

  update participation_credentials
  set status = 'consumed',
      consumed_at = now()
  where id = p_credential_id;
end;
$$;

revoke all on function credential_balances(uuid[]) from public, anon, authenticated;
revoke all on function issue_participation_credentials(uuid, uuid, text[]) from public, anon, authenticated;
revoke all on function submit_anonymous_response(uuid, jsonb) from public, anon, authenticated;

grant execute on function credential_balances(uuid[]) to service_role;
grant execute on function issue_participation_credentials(uuid, uuid, text[]) to service_role;
grant execute on function submit_anonymous_response(uuid, jsonb) to service_role;
