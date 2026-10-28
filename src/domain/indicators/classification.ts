import { Decimal } from "@/domain/shared/decimal";

export const CLASSIFICATION_CODES = [
  "excelente",
  "boa",
  "necessidade_acoes_prioritarias",
  "baixa",
  "muito_baixa",
] as const;

export type ClassificationCode = (typeof CLASSIFICATION_CODES)[number];

export interface ClassificationBand {
  code: ClassificationCode;
  label: string;
  officialRangeLabel: string;
  minimumInclusive: string;
  maximumInclusive: string;
}

/** Faixas descritas no guia. Os rótulos oficiais não devem ser alterados. */
export const OFFICIAL_BANDS: readonly ClassificationBand[] = [
  {
    code: "excelente",
    label: "Excelente",
    officialRangeLabel: "4,5 a 5,0",
    minimumInclusive: "4.50",
    maximumInclusive: "5.00",
  },
  {
    code: "boa",
    label: "Boa",
    officialRangeLabel: "3,5 a 4,4",
    minimumInclusive: "3.50",
    maximumInclusive: "4.49",
  },
  {
    code: "necessidade_acoes_prioritarias",
    label: "Necessidade de ações prioritárias",
    officialRangeLabel: "2,5 a 3,4",
    minimumInclusive: "2.50",
    maximumInclusive: "3.49",
  },
  {
    code: "baixa",
    label: "Baixa — ações urgentes",
    officialRangeLabel: "1,5 a 2,4",
    minimumInclusive: "1.50",
    maximumInclusive: "2.49",
  },
  {
    code: "muito_baixa",
    label: "Muito baixa — intervenção imediata",
    officialRangeLabel: "1,0 a 1,4",
    minimumInclusive: "1.00",
    maximumInclusive: "1.49",
  },
];

/**
 * O guia apresenta limites com uma casa decimal e não define o tratamento
 * dos valores intermediários (por exemplo, 4,45). Esta política é provisória
 * e precisa de homologação institucional antes de produção.
 */
export const CLASSIFICATION_POLICY = {
  id: "pqvst-classification-round-half-up-2-decimals-v1",
  homologation: "pending",
  displayPlaces: 2,
  rounding: "half-away-from-zero",
  statement:
    "O IQVST é arredondado para duas casas decimais e, em seguida, comparado às faixas oficiais. Os intervalos de uma casa que o guia não fecha (como 4,41 a 4,49) permanecem explícitos: de 4,45 a 4,49 a classificação provisória é Boa; 4,50 já é Excelente. O mesmo critério vale para as demais fronteiras.",
} as const;

export function classificationLabel(code: ClassificationCode): string {
  const band = OFFICIAL_BANDS.find((item) => item.code === code);
  if (!band) {
    throw new Error(`Classificação desconhecida: ${code}`);
  }
  return band.label;
}

export function classifyIqvst(value: Decimal): ClassificationCode {
  const rounded = value.round(CLASSIFICATION_POLICY.displayPlaces);
  const lower = Decimal.fromString("1.00");
  const upper = Decimal.fromString("5.00");
  if (rounded.lt(lower) || rounded.gt(upper)) {
    throw new RangeError("IQVST fora da escala oficial de 1 a 5.");
  }
  const match = OFFICIAL_BANDS.find((band) => {
    return (
      rounded.gte(Decimal.fromString(band.minimumInclusive)) &&
      rounded.lte(Decimal.fromString(band.maximumInclusive))
    );
  });
  if (!match) {
    throw new Error("Valor sem faixa de classificação. A política provisória não cobre este caso.");
  }
  return match.code;
}
