import { Decimal } from "@/domain/shared/decimal";
import { AXIS_CODES, axisByCode, type AxisCode } from "@/domain/indicators/axes";
import { classificationLabel } from "@/domain/indicators/classification";
import type { IqvstComputation } from "@/domain/indicators/iqvst";
import { ACTION_STATUS_LABELS, type ActionItem } from "@/domain/action-plans/action-item";

export interface ComparableCycle {
  cycleName: string;
  methodologyId: string;
  iqvst: Decimal | null;
}

export interface CycleComparison {
  comparable: boolean;
  direction: "higher" | "lower" | "unchanged" | "not_comparable";
  statement: string;
}

export function compareCycles(previous: ComparableCycle, current: ComparableCycle): CycleComparison {
  if (previous.methodologyId !== current.methodologyId || !previous.iqvst || !current.iqvst) {
    return {
      comparable: false,
      direction: "not_comparable",
      statement:
        "Os ciclos não são comparados porque a metodologia mudou ou um dos indicadores não pôde ser calculado.",
    };
  }
  const difference = current.iqvst.round(2).compare(previous.iqvst.round(2));
  if (difference === 0) {
    return {
      comparable: true,
      direction: "unchanged",
      statement: `O IQVST de ${current.cycleName} permaneceu igual ao de ${previous.cycleName}, na metodologia ${current.methodologyId}.`,
    };
  }
  const direction = difference > 0 ? "higher" : "lower";
  const relation = difference > 0 ? "superior" : "inferior";
  return {
    comparable: true,
    direction,
    statement: `O IQVST de ${current.cycleName} (${current.iqvst.formatPtBr(2)}) é ${relation} ao de ${previous.cycleName} (${previous.iqvst.formatPtBr(2)}), na mesma metodologia.`,
  };
}

export interface ReportAction {
  axis: AxisCode;
  description: string;
  status: ActionItem["status"];
  expectedResult: string;
}

export interface InstitutionalReport {
  status: "published" | "withheld";
  reason: string | null;
  organizationName: string;
  cycleName: string;
  methodologyId: string;
  generatedAt: string;
  responseCount: number | null;
  iqvst: string | null;
  classification: string | null;
  axes: { code: AxisCode; name: string; mean: string | null }[];
  narrative: string[];
  actions: ReportAction[];
  limitations: string[];
}

export function buildInstitutionalReport(input: {
  organizationName: string;
  cycleName: string;
  methodologyId: string;
  generatedAt: string;
  responseCount: number | null;
  computation: IqvstComputation | null;
  suppressed: boolean;
  comparison: CycleComparison | null;
  actions: readonly ReportAction[];
}): InstitutionalReport {
  const limitations = [
    "O IQVST expressa percepção agregada. Ele não avalia servidor, não autoriza sanção e não mede sozinho a execução das ações.",
    "A leitura depende do número de respostas, da versão do questionário e da política provisória de arredondamento ainda sujeita à homologação.",
  ];
  const base = {
    organizationName: input.organizationName,
    cycleName: input.cycleName,
    methodologyId: input.methodologyId,
    generatedAt: input.generatedAt,
    actions: [...input.actions],
    limitations,
  };

  if (input.suppressed || !input.computation || input.computation.reason !== "computed" || input.computation.display === null) {
    return {
      ...base,
      status: "withheld",
      reason: input.suppressed
        ? "O resultado permanece reservado porque o grupo não atingiu o limite de divulgação."
        : "Não há indicador calculado para este recorte.",
      responseCount: input.suppressed ? null : input.responseCount,
      iqvst: null,
      classification: null,
      axes: AXIS_CODES.map((code) => ({ code, name: axisByCode(code).name, mean: null })),
      narrative: [],
    };
  }

  const computation = input.computation;
  const axes = AXIS_CODES.map((code) => ({
    code,
    name: axisByCode(code).name,
    mean: computation.axisMeans[code]?.formatPtBr(2) ?? null,
  }));
  const ranked = AXIS_CODES.flatMap((code) => {
    const mean = computation.axisMeans[code];
    return mean ? [{ code, name: axisByCode(code).name, mean }] : [];
  });
  const highest = ranked.reduce<(typeof ranked)[number] | null>(
    (best, axis) => (best === null || axis.mean.gt(best.mean) ? axis : best),
    null,
  );
  const lowest = ranked.reduce<(typeof ranked)[number] | null>(
    (best, axis) => (best === null || axis.mean.lt(best.mean) ? axis : best),
    null,
  );
  const narrative = [
    `O IQVST foi ${computation.display}, classificação ${computation.classificationLabel}.`,
  ];
  if (highest && lowest && highest.mean.eq(lowest.mean)) {
    narrative.push("As médias publicadas dos seis eixos foram iguais.");
  } else if (highest && lowest) {
    narrative.push(`A maior média foi ${highest.name} (${highest.mean.formatPtBr(2)}).`);
    narrative.push(`A menor média foi ${lowest.name} (${lowest.mean.formatPtBr(2)}).`);
  }
  if (input.comparison) {
    narrative.push(input.comparison.statement);
  }
  if (input.actions.length === 0) {
    narrative.push("Não há ação de melhoria vinculada a este relatório.");
  }

  return {
    ...base,
    status: "published",
    reason: null,
    responseCount: input.responseCount,
    iqvst: computation.display,
    classification: computation.classification
      ? classificationLabel(computation.classification)
      : null,
    axes,
    narrative,
  };
}

export function reportToCsv(report: InstitutionalReport): string {
  const rows = [
    ["campo", "valor"],
    ["orgao", report.organizationName],
    ["ciclo", report.cycleName],
    ["metodologia", report.methodologyId],
    ["gerado_em", report.generatedAt],
    ["situacao", report.status],
    ["motivo", report.reason ?? ""],
    ["respostas", report.responseCount === null ? "" : String(report.responseCount)],
    ["iqvst", report.iqvst ?? ""],
    ["classificacao", report.classification ?? ""],
    ...report.axes.map((axis) => [`eixo_${axis.code}`, axis.mean ?? ""]),
    ...report.actions.map((action) => [
      `acao_${action.axis}`,
      `${action.description} | ${ACTION_STATUS_LABELS[action.status]} | ${action.expectedResult}`,
    ]),
  ];
  const body = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  return `\uFEFF${body}\r\n`;
}
