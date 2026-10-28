import { fail, ok, type DomainResult } from "@/domain/shared/result";

export const CYCLE_STATES = [
  "draft",
  "scheduled",
  "open",
  "closed",
  "processed",
  "published",
] as const;

export type CycleState = (typeof CYCLE_STATES)[number];

export const CYCLE_STATE_LABELS: Record<CycleState, string> = {
  draft: "Rascunho",
  scheduled: "Programado",
  open: "Aberto",
  closed: "Encerrado",
  processed: "Processado",
  published: "Publicado",
};

const TRANSITIONS: Record<CycleState, readonly CycleState[]> = {
  draft: ["scheduled"],
  scheduled: ["draft", "open"],
  open: ["closed"],
  closed: ["processed"],
  processed: ["published", "closed"],
  published: ["processed"],
};

export interface CycleTransition {
  from: CycleState;
  to: CycleState;
  justification?: string;
}

export function transitionCycle(input: CycleTransition): DomainResult<CycleState> {
  const allowed = TRANSITIONS[input.from];
  if (!allowed.includes(input.to)) {
    return fail(
      "invalid_transition",
      `O ciclo não pode passar de ${CYCLE_STATE_LABELS[input.from]} para ${CYCLE_STATE_LABELS[input.to]}.`,
    );
  }
  const requiresJustification = input.from === "published" && input.to === "processed";
  if (requiresJustification && (input.justification?.trim().length ?? 0) < 10) {
    return fail(
      "justification_required",
      "Retirar um ciclo da publicação exige justificativa com pelo menos 10 caracteres.",
    );
  }
  return ok(input.to);
}

export interface CycleOpenRequirements {
  questionnaireStatus: "draft" | "in_review" | "approved" | "retired";
  hasScoreableQuestionOnEveryAxis: boolean;
}

export function assertCycleCanOpen(requirements: CycleOpenRequirements): DomainResult<true> {
  if (requirements.questionnaireStatus !== "approved") {
    return fail(
      "questionnaire_not_approved",
      "O ciclo só pode ser aberto com uma versão de questionário aprovada.",
    );
  }
  if (!requirements.hasScoreableQuestionOnEveryAxis) {
    return fail(
      "questionnaire_incomplete",
      "Cada um dos seis eixos precisa ter ao menos uma pergunta pontuável antes da abertura.",
    );
  }
  return ok(true);
}
