"use server";

import { revalidatePath } from "next/cache";
import { createActionItem } from "@/domain/action-plans/action-item";
import { authorize } from "@/domain/access/permissions";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { isUuid } from "@/domain/privacy/issuance";
import { saveActionItem, setActionDisclosure } from "@/infrastructure/action-plans/store";
import { recordAudit } from "@/infrastructure/audit/log";
import { actorFromSession, readInstitutionalAccess } from "@/infrastructure/auth/session";
import { loadParticipationDesk } from "@/infrastructure/participation/collection";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export interface FormState {
  error: string | null;
  notice: string | null;
}

async function readyActor() {
  if (!isAdminEntryOpen()) return { error: "A base institucional ainda não está configurada.", actor: null };
  const access = await readInstitutionalAccess();
  if (access.status !== "ready") return { error: "Entre com um papel institucional para registrar a ação.", actor: null };
  return { error: null, actor: actorFromSession(access.session) };
}

export async function saveAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null };
  const [cycleId = "", organizationId = ""] = String(formData.get("link") ?? "").split("|");
  if (!isUuid(organizationId) || !isUuid(cycleId)) return { error: "Escolha o órgão e o ciclo de origem.", notice: null };
  const allowed = authorize(ready.actor, { action: "manage_action_plan", organizationId });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };

  const desk = await loadParticipationDesk(ready.actor.kind === "state_admin" ? "all" : ready.actor.organizationIds);
  if (!desk.ok) return { error: desk.error.message, notice: null };
  const cycle = desk.value.cycles.find((item) => item.id === cycleId);
  if (!cycle || !cycle.organizationIds.includes(organizationId)) {
    return { error: "A ação só entra em um ciclo do qual o órgão participa.", notice: null };
  }

  const axis = String(formData.get("axis") ?? "");
  if (!AXIS_CODES.includes(axis as AxisCode)) return { error: "A ação precisa estar ligada a um dos seis eixos oficiais.", notice: null };
  const draft = createActionItem(
    "pendente",
    {
      organizationId,
      cycleId,
      axis: axis as AxisCode,
      problem: String(formData.get("problem") ?? ""),
      objective: String(formData.get("objective") ?? ""),
      description: String(formData.get("description") ?? ""),
      institutionalOwner: String(formData.get("institutionalOwner") ?? ""),
      dueDate: String(formData.get("dueDate") ?? ""),
      expectedResult: String(formData.get("expectedResult") ?? ""),
      monitoringIndicator: String(formData.get("monitoringIndicator") ?? ""),
    },
    new Date().toISOString(),
  );
  if (!draft.ok) return { error: draft.error.message, notice: null };

  const saved = await saveActionItem({ ...draft.value, cycleName: cycle.name });
  if (!saved.ok) return { error: saved.error.message, notice: null };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "action_recorded",
    entity: "action_items",
    entityId: saved.value.id,
    metadata: { axis: draft.value.axis, organizationId, cycleId },
  });
  revalidatePath("/gestao/planos");
  return { error: null, notice: "Ação gravada no órgão e no ciclo. Ela ainda não entra na página pública." };
}

export async function discloseAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const ready = await readyActor();
  if (!ready.actor) return { error: ready.error, notice: null };
  const allowed = authorize(ready.actor, { action: "publish_results" });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };
  const id = String(formData.get("actionItemId") ?? "");
  if (!isUuid(id)) return { error: "A ação não foi encontrada.", notice: null };
  const disclose = formData.get("disclose") === "1";
  const updated = await setActionDisclosure(id, disclose);
  if (!updated.ok) return { error: updated.error.message, notice: null };
  await recordAudit({
    actorId: ready.actor.userId,
    action: "action_disclosed",
    entity: "action_items",
    entityId: id,
    metadata: { public: disclose },
  });
  revalidatePath("/gestao/planos");
  revalidatePath("/acoes");
  return {
    error: null,
    notice: disclose ? "A ação passou a aparecer na página pública." : "A ação saiu da página pública.",
  };
}
