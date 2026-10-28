import { Decimal, meanDecimals } from "@/domain/shared/decimal";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import {
  CLASSIFICATION_POLICY,
  classificationLabel,
  classifyIqvst,
  type ClassificationCode,
} from "@/domain/indicators/classification";

export interface IqvstComputation {
  axisMeans: Record<AxisCode, Decimal | null>;
  iqvst: Decimal | null;
  display: string | null;
  classification: ClassificationCode | null;
  classificationLabel: string | null;
  reason: "computed" | "missing_axis_data";
  policyId: typeof CLASSIFICATION_POLICY.id;
}

function assertScale(value: Decimal): void {
  if (value.lt(Decimal.fromString("1")) || value.gt(Decimal.fromString("5"))) {
    throw new RangeError("Valor pontuável fora da escala de 1 a 5.");
  }
}

/** Média de uma pergunta. Lista vazia significa ausência de respostas, não zero. */
export function questionMean(values: readonly Decimal[]): Decimal | null {
  for (const value of values) {
    assertScale(value);
  }
  return meanDecimals(values);
}

/**
 * Média do eixo a partir das médias das perguntas pontuáveis.
 * Cada pergunta tem o mesmo peso. Perguntas sem respostas não entram como zero.
 */
export function axisMeanFromQuestions(questionMeans: readonly Decimal[]): Decimal | null {
  for (const mean of questionMeans) {
    assertScale(mean);
  }
  return meanDecimals(questionMeans);
}

/**
 * IQVST = média aritmética das seis médias de eixo.
 * Um eixo sem dado impede o indicador. Não se divide por menos de seis.
 */
export function computeIqvst(axisMeans: Record<AxisCode, Decimal | null>): IqvstComputation {
  for (const axis of AXIS_CODES) {
    if (!Object.hasOwn(axisMeans, axis)) {
      throw new Error(`Eixo obrigatório ausente no cálculo: ${axis}`);
    }
    const mean = axisMeans[axis];
    if (mean) {
      assertScale(mean);
    }
  }

  const ordered = AXIS_CODES.map((axis) => axisMeans[axis]);
  if (ordered.some((mean) => mean === null)) {
    return {
      axisMeans,
      iqvst: null,
      display: null,
      classification: null,
      classificationLabel: null,
      reason: "missing_axis_data",
      policyId: CLASSIFICATION_POLICY.id,
    };
  }

  const iqvst = meanDecimals(ordered.filter((mean): mean is Decimal => mean !== null));
  if (!iqvst) {
    return {
      axisMeans,
      iqvst: null,
      display: null,
      classification: null,
      classificationLabel: null,
      reason: "missing_axis_data",
      policyId: CLASSIFICATION_POLICY.id,
    };
  }

  const classification = classifyIqvst(iqvst);
  return {
    axisMeans,
    iqvst,
    display: iqvst.formatPtBr(2),
    classification,
    classificationLabel: classificationLabel(classification),
    reason: "computed",
    policyId: CLASSIFICATION_POLICY.id,
  };
}
