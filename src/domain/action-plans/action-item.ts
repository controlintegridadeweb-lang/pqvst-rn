import { fail, ok, type DomainResult } from "@/domain/shared/result";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";

export const ACTION_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "suspended",
  "cancelled",
] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  completed: "Concluída",
  suspended: "Suspensa",
  cancelled: "Cancelada",
};

const TRANSITIONS: Record<ActionStatus, readonly ActionStatus[]> = {
  not_started: ["in_progress", "cancelled"],
  in_progress: ["completed", "suspended", "cancelled"],
  suspended: ["in_progress", "cancelled"],
  completed: ["in_progress"],
  cancelled: [],
};

export interface ActionUpdate {
  at: string;
  status: ActionStatus;
  note: string;
}

export interface ActionItem {
  id: string;
  organizationId: string;
  cycleId: string;
  axis: AxisCode;
  problem: string;
  objective: string;
  description: string;
  institutionalOwner: string;
  dueDate: string;
  expectedResult: string;
  monitoringIndicator: string | null;
  status: ActionStatus;
  updates: readonly ActionUpdate[];
}

export interface ActionDraft {
  organizationId: string;
  cycleId: string;
  axis: AxisCode;
  problem: string;
  objective: string;
  description: string;
  institutionalOwner: string;
  dueDate: string;
  expectedResult: string;
  monitoringIndicator: string | null;
}

function requiredText(value: string, label: string): DomainResult<string> {
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    return fail("invalid_action", `${label} precisa ser informado.`);
  }
  return ok(trimmed);
}

export function createActionItem(id: string, draft: ActionDraft, at: string): DomainResult<ActionItem> {
  if (!AXIS_CODES.includes(draft.axis)) {
    return fail("invalid_axis", "A ação precisa estar ligada a um dos seis eixos oficiais.");
  }
  const fields = [
    requiredText(draft.problem, "O problema identificado"),
    requiredText(draft.objective, "O objetivo"),
    requiredText(draft.description, "A descrição da ação"),
    requiredText(draft.institutionalOwner, "O responsável institucional"),
    requiredText(draft.expectedResult, "A meta ou o resultado esperado"),
    requiredText(draft.cycleId, "O ciclo de origem"),
    requiredText(draft.organizationId, "O órgão"),
  ];
  const invalid = fields.find((field) => !field.ok);
  if (invalid && !invalid.ok) {
    return invalid;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) {
    return fail("invalid_due_date", "O prazo deve estar no formato AAAA-MM-DD.");
  }
  const monitoring = draft.monitoringIndicator?.trim() || null;
  return ok({
    id,
    organizationId: draft.organizationId.trim(),
    cycleId: draft.cycleId.trim(),
    axis: draft.axis,
    problem: draft.problem.trim(),
    objective: draft.objective.trim(),
    description: draft.description.trim(),
    institutionalOwner: draft.institutionalOwner.trim(),
    dueDate: draft.dueDate,
    expectedResult: draft.expectedResult.trim(),
    monitoringIndicator: monitoring,
    status: "not_started",
    updates: [{ at, status: "not_started", note: "Ação registrada." }],
  });
}

export function transitionAction(
  item: ActionItem,
  next: ActionStatus,
  at: string,
  note: string,
): DomainResult<ActionItem> {
  if (!TRANSITIONS[item.status].includes(next)) {
    return fail(
      "invalid_action_transition",
      `A ação não pode passar de ${ACTION_STATUS_LABELS[item.status]} para ${ACTION_STATUS_LABELS[next]}.`,
    );
  }
  const justificationNeeded = next === "cancelled" || next === "suspended" || item.status === "completed";
  if (justificationNeeded && note.trim().length < 10) {
    return fail(
      "justification_required",
      "Suspensão, cancelamento ou reabertura exigem justificativa com pelo menos 10 caracteres.",
    );
  }
  if (note.trim().length < 3) {
    return fail("invalid_update", "O registro de acompanhamento precisa de uma nota.");
  }
  return ok({
    ...item,
    status: next,
    updates: [...item.updates, { at, status: next, note: note.trim() }],
  });
}
