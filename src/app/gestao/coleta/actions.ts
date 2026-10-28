"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/domain/access/permissions";
import {
  collectionIsOpen,
  createParticipationToken,
  isUuid,
  parseCycleIdentity,
  parseOrganization,
  parseSourceNote,
  planCredentialBatch,
  planHeadcount,
  assertCollectionWindow,
  todayInRioGrandeDoNorte,
} from "@/domain/privacy/issuance";
import { hashParticipationToken } from "@/domain/privacy/participation";
import { actorFromSession, readInstitutionalAccess } from "@/infrastructure/auth/session";
import {
  createOrganizationRecord,
  credentialTotal,
  loadParticipationDesk,
  openCollection,
  persistCredentialHashes,
  recordEligiblePopulation,
} from "@/infrastructure/participation/collection";
import { recordAudit } from "@/infrastructure/audit/log";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export interface FormState {
  error: string | null;
  notice: string | null;
}

export interface IssueState extends FormState {
  tokens: readonly string[];
}

async function readyActor() {
  if (!isAdminEntryOpen()) return { error: "A base institucional ainda não está configurada.", actor: null };
  const access = await readInstitutionalAccess();
  if (access.status !== "ready") {
    return { error: "Entre com um papel institucional para alterar a coleta.", actor: null };
  }
  return { error: null, actor: actorFromSession(access.session) };
}

function refreshDesk() {
  revalidatePath("/gestao/orgaos");
  revalidatePath("/gestao/ciclos");
  revalidatePath("/gestao/credenciais");
}

export async function createOrganization(_previous: FormState, formData: FormData): Promise<FormState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null };
  const allowed = authorize(ready.actor, { action: "manage_organizations" });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };

  const parsed = parseOrganization(String(formData.get("name") ?? ""), String(formData.get("acronym") ?? ""));
  if (!parsed.ok) return { error: parsed.error.message, notice: null };
  const created = await createOrganizationRecord(parsed.value);
  if (!created.ok) return { error: created.error.message, notice: null };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "organization_created",
    entity: "organizations",
    entityId: created.value.id,
    metadata: { acronym: parsed.value.acronym },
  });
  refreshDesk();
  return { error: null, notice: "Órgão cadastrado. Ele já pode entrar em um ciclo." };
}

export async function openCycle(_previous: FormState, formData: FormData): Promise<FormState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null };
  const allowed = authorize(ready.actor, { action: "manage_cycles" });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };

  const identity = parseCycleIdentity(String(formData.get("name") ?? ""), String(formData.get("referencePeriod") ?? ""));
  if (!identity.ok) return { error: identity.error.message, notice: null };
  const opensOn = String(formData.get("opensOn") ?? "");
  const closesOn = String(formData.get("closesOn") ?? "");
  const window = assertCollectionWindow(opensOn, closesOn);
  if (!window.ok) return { error: window.error.message, notice: null };

  const organizationIds = formData.getAll("organizationId").map((value) => String(value)).filter(isUuid);
  const opened = await openCollection({
    name: identity.value.name,
    referencePeriod: identity.value.referencePeriod,
    opensOn,
    closesOn,
    organizationIds,
  });
  if (!opened.ok) return { error: opened.error.message, notice: null };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "cycle_opened",
    entity: "survey_cycles",
    entityId: opened.value.id,
    metadata: { name: identity.value.name },
  });
  refreshDesk();
  return { error: null, notice: "A coleta foi aberta com o formulário oficial." };
}

export async function saveHeadcount(_previous: FormState, formData: FormData): Promise<FormState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null };
  const cycleId = String(formData.get("cycleId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!isUuid(cycleId) || !isUuid(organizationId)) {
    return { error: "Escolha o ciclo e o órgão.", notice: null };
  }
  const allowed = authorize(ready.actor, { action: "manage_cycles", organizationId });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };

  const headcount = Number(formData.get("headcount"));
  const note = parseSourceNote(String(formData.get("sourceNote") ?? ""));
  if (!note.ok) return { error: note.error.message, notice: null };
  const existing = await credentialTotal(cycleId, organizationId);
  if (!existing.ok) return { error: existing.error.message, notice: null };
  const planned = planHeadcount(headcount, existing.value);
  if (!planned.ok) return { error: planned.error.message, notice: null };

  const saved = await recordEligiblePopulation({
    cycleId,
    organizationId,
    headcount: planned.value,
    sourceNote: note.value,
  });
  if (!saved.ok) return { error: saved.error.message, notice: null };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "headcount_recorded",
    entity: "eligible_populations",
    entityId: organizationId,
    metadata: { cycleId, headcount: planned.value },
  });
  refreshDesk();
  return { error: null, notice: "Quantitativo de servidores elegíveis registrado." };
}

export async function issueCredentials(_previous: IssueState, formData: FormData): Promise<IssueState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null, tokens: [] };
  const cycleId = String(formData.get("cycleId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!isUuid(cycleId) || !isUuid(organizationId)) {
    return { error: "Escolha o ciclo e o órgão.", notice: null, tokens: [] };
  }
  const allowed = authorize(ready.actor, { action: "issue_credentials", organizationId });
  if (!allowed.ok) return { error: allowed.error.message, notice: null, tokens: [] };

  const desk = await loadParticipationDesk(ready.actor.kind === "state_admin" ? "all" : ready.actor.organizationIds);
  if (!desk.ok) return { error: desk.error.message, notice: null, tokens: [] };
  const cycle = desk.value.cycles.find((item) => item.id === cycleId);
  const population = desk.value.populations.find(
    (item) => item.cycleId === cycleId && item.organizationId === organizationId,
  );
  const balance = desk.value.balances.find(
    (item) => item.cycleId === cycleId && item.organizationId === organizationId,
  );
  if (
    !cycle ||
    !cycle.organizationIds.includes(organizationId) ||
    !collectionIsOpen({
      cycleStatus: cycle.status,
      opensOn: cycle.opensOn,
      closesOn: cycle.closesOn,
      today: todayInRioGrandeDoNorte(),
    })
  ) {
    return { error: "O ciclo não está aberto para esta operação.", notice: null, tokens: [] };
  }

  const requested = Number(formData.get("quantity"));
  const planned = planCredentialBatch({
    headcount: population?.headcount ?? 0,
    alreadyIssued: balance?.total ?? 0,
    requested,
  });
  if (!planned.ok) return { error: planned.error.message, notice: null, tokens: [] };

  const secret = process.env.PARTICIPATION_TOKEN_PEPPER?.trim() ?? "";
  const tokens = Array.from({ length: planned.value }, () => createParticipationToken());
  const hashes = await Promise.all(tokens.map((token) => hashParticipationToken(token, secret)));
  const stored = await persistCredentialHashes(cycleId, organizationId, hashes);
  if (!stored.ok) return { error: stored.error.message, notice: null, tokens: [] };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "credentials_issued",
    entity: "participation_credentials",
    entityId: organizationId,
    metadata: { cycleId, quantity: planned.value },
  });
  refreshDesk();
  return { error: null, notice: null, tokens };
}
