import { Decimal, divideDecimal } from "@/domain/shared/decimal";
import { DISCLOSURE_THRESHOLD } from "@/domain/privacy/disclosure";

export type ParticipationRate =
  | { status: "available"; label: string; responses: number; eligible: number }
  | {
      status: "unavailable";
      reason: "eligible_unknown" | "below_disclosure_threshold" | "inconsistent_counts";
    };

/**
 * A taxa só aparece com quantitativo confiável de servidores elegíveis
 * e grupo suficiente para divulgação. Não é limitada artificialmente a 100%.
 */
export function participationRate(
  responses: number,
  eligible: number | null,
  minimumResponses = DISCLOSURE_THRESHOLD.minimumResponses,
): ParticipationRate {
  if (!Number.isInteger(responses) || responses < 0) {
    throw new Error("Quantidade de respostas inválida.");
  }
  if (eligible === null) {
    return { status: "unavailable", reason: "eligible_unknown" };
  }
  if (!Number.isInteger(eligible) || eligible <= 0) {
    throw new Error("Quantitativo de elegíveis inválido.");
  }
  if (responses > eligible) {
    return { status: "unavailable", reason: "inconsistent_counts" };
  }
  if (responses < minimumResponses) {
    return { status: "unavailable", reason: "below_disclosure_threshold" };
  }
  const percentage = divideDecimal(Decimal.fromInt(responses * 100), eligible);
  return {
    status: "available",
    label: `${percentage.formatPtBr(1)}%`,
    responses,
    eligible,
  };
}
