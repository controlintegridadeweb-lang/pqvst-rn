import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { Decimal } from "@/domain/shared/decimal";

/** Limite técnico inicial. Não equivale a anonimização absoluta. */
export const DISCLOSURE_THRESHOLD = {
  minimumResponses: 10,
  homologation: "pending",
  statement:
    "Grupos com menos de 10 respostas válidas ficam de fora da divulgação. O número aguarda análise de risco institucional e não impede reidentificação por outros meios.",
} as const;

export type PublicationStatus = "published" | "suppressed" | "no_data" | "not_computable";

export interface AxisDisclosureInput {
  axis: AxisCode;
  responseCount: number;
  mean: Decimal | null;
}

export interface AxisDisclosure {
  axis: AxisCode;
  responseCount: number | null;
  mean: Decimal | null;
  status: PublicationStatus;
  suppression: "primary" | "complementary" | null;
}

export interface DisclosureDecision {
  responseCount: number | null;
  iqvst: Decimal | null;
  iqvstStatus: PublicationStatus;
  axes: AxisDisclosure[];
}

/**
 * Protege a publicação de um órgão.
 * Se apenas um eixo for omitido e o IQVST continuar visível, a média oculta
 * pode ser reconstituída pela fórmula. Nesse caso, outro eixo também é omitido.
 */
export function protectPublication(
  overallCount: number,
  axes: readonly AxisDisclosureInput[],
  iqvst: Decimal | null,
  minimumResponses = DISCLOSURE_THRESHOLD.minimumResponses,
): DisclosureDecision {
  if (!Number.isInteger(overallCount) || overallCount < 0) {
    throw new Error("Quantidade de respostas inválida.");
  }
  if (axes.length !== AXIS_CODES.length) {
    throw new Error("A divulgação exige os seis eixos oficiais.");
  }

  if (overallCount === 0) {
    return {
      responseCount: 0,
      iqvst: null,
      iqvstStatus: "no_data",
      axes: AXIS_CODES.map((axis) => ({
        axis,
        responseCount: 0,
        mean: null,
        status: "no_data",
        suppression: null,
      })),
    };
  }

  if (overallCount < minimumResponses) {
    return {
      responseCount: null,
      iqvst: null,
      iqvstStatus: "suppressed",
      axes: AXIS_CODES.map((axis) => ({
        axis,
        responseCount: null,
        mean: null,
        status: "suppressed",
        suppression: "primary",
      })),
    };
  }

  const byAxis = new Map(axes.map((axis) => [axis.axis, axis]));
  const initial: AxisDisclosure[] = AXIS_CODES.map((axis) => {
    const input = byAxis.get(axis);
    if (!input) {
      throw new Error(`Eixo ausente na divulgação: ${axis}`);
    }
    if (input.responseCount === 0 || input.mean === null) {
      return {
        axis,
        responseCount: 0,
        mean: null,
        status: input.responseCount === 0 ? "no_data" : "not_computable",
        suppression: null,
      };
    }
    if (input.responseCount < minimumResponses) {
      return {
        axis,
        responseCount: null,
        mean: null,
        status: "suppressed",
        suppression: "primary",
      };
    }
    return {
      axis,
      responseCount: input.responseCount,
      mean: input.mean,
      status: "published",
      suppression: null,
    };
  });

  const hidden = initial.filter((axis) => axis.status !== "published");
  const canRecoverHiddenMean = hidden.length === 1 && iqvst !== null;
  if (canRecoverHiddenMean) {
    const published = initial.filter((axis) => axis.status === "published");
    const candidate = [...published].sort((left, right) => {
      const countDiff = (left.responseCount ?? 0) - (right.responseCount ?? 0);
      if (countDiff !== 0) return countDiff;
      return right.axis.localeCompare(left.axis);
    })[0];
    if (candidate) {
      const index = initial.findIndex((axis) => axis.axis === candidate.axis);
      const current = initial[index];
      if (current) {
        initial[index] = {
          ...current,
          responseCount: null,
          mean: null,
          status: "suppressed",
          suppression: "complementary",
        };
      }
    }
  }

  return {
    responseCount: overallCount,
    iqvst: iqvst,
    iqvstStatus: iqvst === null ? "not_computable" : "published",
    axes: initial,
  };
}

export function canPublishDistribution(
  responseCount: number,
  explicitlyAuthorized: boolean,
  minimumResponses = DISCLOSURE_THRESHOLD.minimumResponses,
): boolean {
  return explicitlyAuthorized && responseCount >= minimumResponses;
}
