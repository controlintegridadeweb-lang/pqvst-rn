import "server-only";

import { CLASSIFICATION_POLICY } from "@/domain/indicators/classification";
import { assertCycleCanOpen } from "@/domain/cycles/cycle";
import { isCycleState, isUuid, readCredentialStatus } from "@/domain/privacy/issuance";
import type { CredentialStatus } from "@/domain/privacy/participation";
import type { CycleState } from "@/domain/cycles/cycle";
import { fail, ok, type DomainResult } from "@/domain/shared/result";
import {
  LIKERT_SCALES,
  SCALE_LABELS,
  axesMissingScoreableQuestions,
  getOfficialQuestionnaire,
  type LikertScale,
} from "@/domain/surveys/questionnaire";
import { createServiceClient } from "@/infrastructure/supabase/admin";

type ServiceClient = ReturnType<typeof createServiceClient>;

export interface DeskOrganization {
  id: string;
  name: string;
  acronym: string;
}

export interface DeskCycle {
  id: string;
  name: string;
  status: CycleState;
  opensOn: string;
  closesOn: string;
  organizationIds: readonly string[];
}

export interface DeskPopulation {
  cycleId: string;
  organizationId: string;
  headcount: number;
}

export interface DeskBalance {
  cycleId: string;
  organizationId: string;
  total: number;
  available: number;
  consumed: number;
}

export interface ParticipationDesk {
  organizations: DeskOrganization[];
  cycles: DeskCycle[];
  populations: DeskPopulation[];
  balances: DeskBalance[];
}

export interface StoredCredential {
  id: string;
  status: CredentialStatus;
  cycleId: string;
  organizationId: string;
  cycleStatus: CycleState;
  opensOn: string;
  closesOn: string;
}

const PERSISTENCE_ERROR = "Não foi possível gravar na base institucional.";
const READ_ERROR = "A base institucional não pôde ser consultada.";

const RPC_MESSAGES: Record<string, string> = {
  invalid_batch: "Informe uma quantidade entre 1 e 500.",
  invalid_hash: "Não foi possível gravar as credenciais.",
  cycle_closed: "O ciclo não está aberto para esta operação.",
  organization_not_in_cycle: "Este órgão não participa do ciclo aberto.",
  headcount_missing: "Registre o quantitativo de servidores elegíveis antes de emitir credenciais.",
  headcount_exceeded: "A quantidade passa do número de servidores elegíveis.",
  credential_unavailable: "Esta credencial já foi utilizada, revogada ou está vencida. O envio não foi registrado.",
  invalid_answers: "As respostas não conferem com o formulário deste ciclo.",
};

function databaseMessage(error: { message?: string; code?: string } | null): string {
  const message = error?.message ?? "";
  if (error?.code === "23505" && message.includes("acronym")) {
    return "Esta sigla já está cadastrada.";
  }
  for (const [code, text] of Object.entries(RPC_MESSAGES)) {
    if (message.includes(code)) return text;
  }
  return PERSISTENCE_ERROR;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap((item) => {
    const record = asRecord(item);
    return record ? [record] : [];
  });
  const record = asRecord(value);
  return record ? [record] : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function whole(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function clientOrNull(): ServiceClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServiceClient();
}

export async function loadParticipationDesk(scope: "all" | readonly string[]): Promise<DomainResult<ParticipationDesk>> {
  if (scope !== "all" && scope.length === 0) {
    return ok({ organizations: [], cycles: [], populations: [], balances: [] });
  }
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);

  let organizationsQuery = client.from("organizations").select("id, name, acronym, participation").order("name");
  if (scope !== "all") organizationsQuery = organizationsQuery.in("id", [...scope]);
  const { data: organizationRows, error: organizationError } = await organizationsQuery;
  if (organizationError) return fail("persistence_failed", READ_ERROR);

  const { data: cycleRows, error: cycleError } = await client
    .from("survey_cycles")
    .select("id, name, status, opens_on, closes_on, cycle_organizations(organization_id, participation)")
    .order("opens_on", { ascending: false });
  if (cycleError) return fail("persistence_failed", READ_ERROR);

  const allowed = scope === "all" ? null : new Set(scope);
  const organizations = asRecords(organizationRows).flatMap((row) => {
    const id = text(row.id);
    const name = text(row.name);
    const acronym = text(row.acronym);
    if (!id || !name || !acronym || row.participation !== "active") return [];
    return [{ id, name, acronym }];
  });

  const cycles = asRecords(cycleRows).flatMap((row) => {
    const id = text(row.id);
    const name = text(row.name);
    const status = text(row.status);
    const opensOn = text(row.opens_on);
    const closesOn = text(row.closes_on);
    if (!id || !name || !status || !isCycleState(status) || !opensOn || !closesOn) return [];
    const organizationIds = asRecords(row.cycle_organizations).flatMap((link) => {
      const organizationId = text(link.organization_id);
      if (!organizationId || link.participation !== "active") return [];
      if (allowed && !allowed.has(organizationId)) return [];
      return [organizationId];
    });
    if (allowed && organizationIds.length === 0) return [];
    return [{ id, name, status, opensOn, closesOn, organizationIds }];
  });

  const cycleIds = cycles.map((cycle) => cycle.id);
  if (cycleIds.length === 0) {
    return ok({ organizations, cycles, populations: [], balances: [] });
  }

  const { data: populationRows, error: populationError } = await client
    .from("eligible_populations")
    .select("cycle_id, organization_id, headcount")
    .in("cycle_id", cycleIds);
  if (populationError) return fail("persistence_failed", READ_ERROR);

  const populations = asRecords(populationRows).flatMap((row) => {
    const cycleId = text(row.cycle_id);
    const organizationId = text(row.organization_id);
    const headcount = whole(row.headcount);
    if (!cycleId || !organizationId || headcount === null) return [];
    if (allowed && !allowed.has(organizationId)) return [];
    return [{ cycleId, organizationId, headcount }];
  });

  const { data: balanceRows, error: balanceError } = await client.rpc("credential_balances", {
    p_cycle_ids: cycleIds,
  });
  if (balanceError) return fail("persistence_failed", READ_ERROR);

  const balances = asRecords(balanceRows).flatMap((row) => {
    const cycleId = text(row.cycle_id);
    const organizationId = text(row.organization_id);
    const total = whole(row.total);
    const available = whole(row.available);
    const consumed = whole(row.consumed);
    if (!cycleId || !organizationId || total === null || available === null || consumed === null) return [];
    if (allowed && !allowed.has(organizationId)) return [];
    return [{ cycleId, organizationId, total, available, consumed }];
  });

  return ok({ organizations, cycles, populations, balances });
}

export async function createOrganizationRecord(input: {
  name: string;
  acronym: string;
}): Promise<DomainResult<{ id: string }>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { data, error } = await client
    .from("organizations")
    .insert({ name: input.name, acronym: input.acronym, participation: "active" })
    .select("id")
    .single();
  if (error || !data) return fail("persistence_failed", databaseMessage(error));
  const id = text(asRecord(data)?.id);
  if (!id) return fail("persistence_failed", PERSISTENCE_ERROR);
  return ok({ id });
}

async function discardQuestionnaire(client: ServiceClient, questionnaireId: string) {
  const { data: versions } = await client.from("questionnaire_versions").select("id").eq("questionnaire_id", questionnaireId);
  const versionIds = asRecords(versions).flatMap((row) => {
    const id = text(row.id);
    return id ? [id] : [];
  });
  if (versionIds.length > 0) {
    const { data: questions } = await client.from("survey_questions").select("id").in("questionnaire_version_id", versionIds);
    const questionIds = asRecords(questions).flatMap((row) => {
      const id = text(row.id);
      return id ? [id] : [];
    });
    if (questionIds.length > 0) {
      await client.from("question_options").delete().in("question_id", questionIds);
      await client.from("survey_questions").delete().in("id", questionIds);
    }
    await client.from("questionnaire_versions").delete().in("id", versionIds);
  }
  await client.from("questionnaires").delete().eq("id", questionnaireId);
}

async function ensureOfficialVersion(client: ServiceClient): Promise<DomainResult<string>> {
  const official = getOfficialQuestionnaire();
  if (!official) return fail("questionnaire_missing", "O formulário oficial não está disponível.");
  const ready = assertCycleCanOpen({
    questionnaireStatus: official.status,
    hasScoreableQuestionOnEveryAxis: axesMissingScoreableQuestions(official.questions).length === 0,
  });
  if (!ready.ok) return ready;

  const { data: existing, error: existingError } = await client
    .from("questionnaire_versions")
    .select("id")
    .eq("version_label", official.versionLabel)
    .eq("source_document", official.sourceDocument)
    .maybeSingle();
  if (existingError) return fail("persistence_failed", READ_ERROR);
  const existingId = text(asRecord(existing)?.id);
  if (existingId) {
    const { count, error } = await client
      .from("survey_questions")
      .select("id", { count: "exact", head: true })
      .eq("questionnaire_version_id", existingId);
    if (error || count !== official.questions.length) {
      return fail("questionnaire_mismatch", "A versão gravada do formulário não confere com o formulário oficial.");
    }
    return ok(existingId);
  }

  const { data: axes, error: axisError } = await client.from("survey_axes").select("id, code");
  if (axisError) return fail("persistence_failed", READ_ERROR);
  const axisId = new Map(asRecords(axes).flatMap((row) => {
    const code = text(row.code);
    const id = text(row.id);
    return code && id ? [[code, id] as const] : [];
  }));

  const { data: questionnaire, error: questionnaireError } = await client
    .from("questionnaires")
    .insert({ title: official.versionLabel })
    .select("id")
    .single();
  const questionnaireId = text(asRecord(questionnaire)?.id);
  if (questionnaireError || !questionnaireId) return fail("persistence_failed", PERSISTENCE_ERROR);

  const { data: version, error: versionError } = await client
    .from("questionnaire_versions")
    .insert({
      questionnaire_id: questionnaireId,
      version_number: 1,
      version_label: official.versionLabel,
      status: "approved",
      origin: "official_import",
      source_document: official.sourceDocument,
      source_url: official.sourceUrl,
      methodology_id: CLASSIFICATION_POLICY.id,
    })
    .select("id")
    .single();
  const versionId = text(asRecord(version)?.id);
  if (versionError || !versionId) {
    await discardQuestionnaire(client, questionnaireId);
    return fail("persistence_failed", PERSISTENCE_ERROR);
  }

  const questions = official.questions.map((question) => ({
    questionnaire_version_id: versionId,
    axis_id: question.axisCode ? (axisId.get(question.axisCode) ?? null) : null,
    code: question.code,
    prompt: question.prompt,
    section_label: question.section,
    sort_order: question.order,
    required: question.required,
    scale: question.scale,
    scoring: question.scoring,
  }));
  if (questions.some((question) => question.axis_id === null && official.questions.find((item) => item.code === question.code)?.axisCode)) {
    await discardQuestionnaire(client, questionnaireId);
    return fail("persistence_failed", "Os eixos oficiais não estão disponíveis na base.");
  }

  const { data: insertedQuestions, error: questionError } = await client
    .from("survey_questions")
    .insert(questions)
    .select("id, code, scale");
  if (questionError || !insertedQuestions) {
    await discardQuestionnaire(client, questionnaireId);
    return fail("persistence_failed", PERSISTENCE_ERROR);
  }

  const options = asRecords(insertedQuestions).flatMap((row) => {
    const questionId = text(row.id);
    const scale = text(row.scale);
    if (!questionId || !scale || !LIKERT_SCALES.includes(scale as LikertScale)) return [];
    return SCALE_LABELS[scale as LikertScale].map((option) => ({
      question_id: questionId,
      value: option.value,
      label: option.label,
    }));
  });
  if (options.length > 0) {
    const { error: optionError } = await client.from("question_options").insert(options);
    if (optionError) {
      await discardQuestionnaire(client, questionnaireId);
      return fail("persistence_failed", PERSISTENCE_ERROR);
    }
  }

  return ok(versionId);
}

export async function openCollection(input: {
  name: string;
  referencePeriod: string;
  opensOn: string;
  closesOn: string;
  organizationIds: readonly string[];
}): Promise<DomainResult<{ id: string }>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const organizationIds = [...new Set(input.organizationIds)];
  if (organizationIds.length === 0 || organizationIds.some((id) => !isUuid(id))) {
    return fail("organization_required", "Escolha ao menos um órgão participante.");
  }

  const version = await ensureOfficialVersion(client);
  if (!version.ok) return version;

  const { data: organizations, error: organizationError } = await client
    .from("organizations")
    .select("id")
    .in("id", organizationIds)
    .eq("participation", "active");
  if (organizationError || asRecords(organizations).length !== organizationIds.length) {
    return fail("organization_required", "Escolha órgãos ativos já cadastrados.");
  }

  const { data: cycle, error: cycleError } = await client
    .from("survey_cycles")
    .insert({
      name: input.name,
      reference_period: input.referencePeriod,
      opens_on: input.opensOn,
      closes_on: input.closesOn,
      questionnaire_version_id: version.value,
      status: "open",
      methodology_id: CLASSIFICATION_POLICY.id,
    })
    .select("id")
    .single();
  const cycleId = text(asRecord(cycle)?.id);
  if (cycleError || !cycleId) return fail("persistence_failed", PERSISTENCE_ERROR);

  const { error: linkError } = await client.from("cycle_organizations").insert(
    organizationIds.map((organizationId) => ({
      cycle_id: cycleId,
      organization_id: organizationId,
      participation: "active",
    })),
  );
  if (linkError) {
    await client.from("survey_cycles").delete().eq("id", cycleId);
    return fail("persistence_failed", PERSISTENCE_ERROR);
  }
  return ok({ id: cycleId });
}

export async function recordEligiblePopulation(input: {
  cycleId: string;
  organizationId: string;
  headcount: number;
  sourceNote: string;
}): Promise<DomainResult<true>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { error } = await client.from("eligible_populations").upsert(
    {
      cycle_id: input.cycleId,
      organization_id: input.organizationId,
      headcount: input.headcount,
      source_note: input.sourceNote,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "cycle_id,organization_id" },
  );
  if (error) return fail("persistence_failed", databaseMessage(error));
  return ok(true);
}

export async function credentialTotal(cycleId: string, organizationId: string): Promise<DomainResult<number>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { count, error } = await client
    .from("participation_credentials")
    .select("id", { count: "exact", head: true })
    .eq("cycle_id", cycleId)
    .eq("organization_id", organizationId);
  if (error || count === null) return fail("persistence_failed", READ_ERROR);
  return ok(count);
}

export async function persistCredentialHashes(
  cycleId: string,
  organizationId: string,
  hashes: readonly string[],
): Promise<DomainResult<number>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { data, error } = await client.rpc("issue_participation_credentials", {
    p_cycle_id: cycleId,
    p_organization_id: organizationId,
    p_token_hashes: [...hashes],
  });
  if (error) return fail("persistence_failed", databaseMessage(error));
  return ok(typeof data === "number" ? data : hashes.length);
}

export async function submitAnonymousResponse(
  credentialId: string,
  answers: Record<string, number | string>,
): Promise<DomainResult<true>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { error } = await client.rpc("submit_anonymous_response", {
    p_credential_id: credentialId,
    p_answers: answers,
  });
  if (error) return fail("persistence_failed", databaseMessage(error));
  return ok(true);
}

async function readCredential(column: "id" | "token_hash", value: string): Promise<StoredCredential | null> {
  const client = clientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from("participation_credentials")
    .select("id, status, cycle_id, organization_id, survey_cycles!inner(status, opens_on, closes_on)")
    .eq(column, value)
    .maybeSingle();
  if (error || !data) return null;
  const row = asRecord(data);
  if (!row) return null;
  const cycle = asRecord(Array.isArray(row.survey_cycles) ? row.survey_cycles[0] : row.survey_cycles);
  const id = text(row.id);
  const status = readCredentialStatus(row.status);
  const cycleId = text(row.cycle_id);
  const organizationId = text(row.organization_id);
  const cycleStatus = text(cycle?.status);
  const opensOn = text(cycle?.opens_on);
  const closesOn = text(cycle?.closes_on);
  if (!id || !status || !cycleId || !organizationId || !cycleStatus || !isCycleState(cycleStatus) || !opensOn || !closesOn) {
    return null;
  }
  return { id, status, cycleId, organizationId, cycleStatus, opensOn, closesOn };
}

export function findCredentialById(id: string): Promise<StoredCredential | null> {
  return readCredential("id", id);
}

export function findCredentialByHash(tokenHash: string): Promise<StoredCredential | null> {
  return readCredential("token_hash", tokenHash);
}
