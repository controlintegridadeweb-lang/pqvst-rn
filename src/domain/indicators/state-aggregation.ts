import { Decimal, divideDecimal, meanDecimals } from "@/domain/shared/decimal";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { computeIqvst, type IqvstComputation } from "@/domain/indicators/iqvst";

/**
 * O guia não explicita se o resultado estadual pondera respostas ou órgãos.
 * As duas funções existem para homologação. A divulgação provisória usa
 * apenas órgãos publicáveis e o peso igual por resposta válida.
 */
export const STATE_AGGREGATION_POLICY = {
  id: "pooled-responses-of-publishable-organizations-v1",
  homologation: "pending",
  publicStrategy: "pooled_responses",
  statement:
    "O indicador estadual publicado reúne as respostas dos órgãos que atingem o limite de divulgação. Cada resposta válida tem o mesmo peso. Órgãos abaixo do limite não entram nesse consolidado, para evitar que a diferença entre o total e os órgãos publicados revele um grupo pequeno. A média não ponderada entre órgãos está implementada, mas não é apresentada como regra oficial.",
} as const;

export interface QuestionAggregate {
  questionId: string;
  sum: Decimal;
  count: number;
}

export interface OrganizationAxisInput {
  organizationId: string;
  responseCount: number;
  questionsByAxis: Record<AxisCode, readonly QuestionAggregate[]>;
}

export interface PublishedOrganizationResult {
  organizationId: string;
  responseCount: number | null;
  status: "published" | "suppressed" | "no_data";
  computation: IqvstComputation | null;
}

export interface PublishedStateResult {
  strategyId: typeof STATE_AGGREGATION_POLICY.id;
  computation: IqvstComputation | null;
  organizations: PublishedOrganizationResult[];
  includedOrganizationIds: string[];
  excludedOrganizationIds: string[];
}

function axisMeansFromQuestions(
  questionsByAxis: Record<AxisCode, readonly QuestionAggregate[]>,
): Record<AxisCode, Decimal | null> {
  const means = {} as Record<AxisCode, Decimal | null>;
  for (const axis of AXIS_CODES) {
    const questions = questionsByAxis[axis];
    const questionMeans = questions
      .filter((question) => question.count > 0)
      .map((question) => divideDecimal(question.sum, question.count));
    means[axis] = questionMeans.length === 0 ? null : meanDecimals(questionMeans);
  }
  return means;
}

export function organizationComputation(input: OrganizationAxisInput): IqvstComputation {
  return computeIqvst(axisMeansFromQuestions(input.questionsByAxis));
}

/** Média não ponderada entre órgãos com IQVST calculável. Não é a regra pública provisória. */
export function unweightedOrganizationIqvst(
  organizations: readonly OrganizationAxisInput[],
): IqvstComputation | null {
  const complete = organizations.filter(
    (organization) => organizationComputation(organization).reason === "computed",
  );
  if (complete.length === 0) return null;
  const axes = {} as Record<AxisCode, Decimal | null>;
  for (const axis of AXIS_CODES) {
    const values = complete
      .map((organization) => axisMeansFromQuestions(organization.questionsByAxis)[axis])
      .filter((value): value is Decimal => value !== null);
    axes[axis] = meanDecimals(values);
  }
  return computeIqvst(axes);
}

function pooledQuestions(
  organizations: readonly OrganizationAxisInput[],
): Record<AxisCode, QuestionAggregate[]> {
  const pooled = {} as Record<AxisCode, QuestionAggregate[]>;
  for (const axis of AXIS_CODES) {
    const byQuestion = new Map<string, { sum: Decimal; count: number }>();
    for (const organization of organizations) {
      for (const question of organization.questionsByAxis[axis]) {
        const current = byQuestion.get(question.questionId) ?? {
          sum: Decimal.fromInt(0),
          count: 0,
        };
        byQuestion.set(question.questionId, {
          sum: current.sum.add(question.sum),
          count: current.count + question.count,
        });
      }
    }
    pooled[axis] = [...byQuestion.entries()].map(([questionId, aggregate]) => ({
      questionId,
      sum: aggregate.sum,
      count: aggregate.count,
    }));
  }
  return pooled;
}

export function publishStateAggregate(
  organizations: readonly OrganizationAxisInput[],
  minimumResponses: number,
): PublishedStateResult {
  if (!Number.isInteger(minimumResponses) || minimumResponses < 2) {
    throw new Error("O limite de divulgação precisa ser um inteiro maior ou igual a 2.");
  }

  const published: PublishedOrganizationResult[] = [];
  const included: OrganizationAxisInput[] = [];
  const excluded: string[] = [];

  for (const organization of organizations) {
    if (organization.responseCount === 0) {
      published.push({
        organizationId: organization.organizationId,
        responseCount: 0,
        status: "no_data",
        computation: null,
      });
      excluded.push(organization.organizationId);
      continue;
    }
    if (organization.responseCount < minimumResponses) {
      published.push({
        organizationId: organization.organizationId,
        responseCount: null,
        status: "suppressed",
        computation: null,
      });
      excluded.push(organization.organizationId);
      continue;
    }
    included.push(organization);
    published.push({
      organizationId: organization.organizationId,
      responseCount: organization.responseCount,
      status: "published",
      computation: organizationComputation(organization),
    });
  }

  const computation =
    included.length === 0
      ? null
      : computeIqvst(axisMeansFromQuestions(pooledQuestions(included)));

  return {
    strategyId: STATE_AGGREGATION_POLICY.id,
    computation,
    organizations: published,
    includedOrganizationIds: included.map((organization) => organization.organizationId),
    excludedOrganizationIds: excluded,
  };
}
