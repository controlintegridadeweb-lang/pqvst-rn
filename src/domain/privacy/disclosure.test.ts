import { describe, expect, it } from "vitest";
import { Decimal } from "@/domain/shared/decimal";
import { AXIS_CODES } from "@/domain/indicators/axes";
import { computeIqvst } from "@/domain/indicators/iqvst";
import {
  publishStateAggregate,
  unweightedOrganizationIqvst,
  type OrganizationAxisInput,
} from "@/domain/indicators/state-aggregation";
import { canPublishDistribution, protectPublication } from "@/domain/privacy/disclosure";
import { participationRate } from "@/domain/privacy/participation-rate";
import { consumeCredential, hashParticipationToken, validateParticipationTokenFormat } from "@/domain/privacy/participation";

function uniform(id: string, responseCount: number, itemValue: number): OrganizationAxisInput {
  const questionsByAxis = {} as OrganizationAxisInput["questionsByAxis"];
  for (const axis of AXIS_CODES) {
    questionsByAxis[axis] = [
      {
        questionId: `${axis}-q`,
        sum: Decimal.fromInt(itemValue * responseCount),
        count: responseCount,
      },
    ];
  }
  return { organizationId: id, responseCount, questionsByAxis };
}

describe("agregação e privacidade", () => {
  it("não inclui órgão pequeno no IQVST estadual publicado", () => {
    const result = publishStateAggregate([uniform("grande", 20, 4), uniform("pequeno", 5, 2)], 10);
    expect(result.includedOrganizationIds).toEqual(["grande"]);
    expect(result.computation?.display).toBe("4,00");
    const hidden = result.organizations.find((item) => item.organizationId === "pequeno");
    expect(hidden?.status).toBe("suppressed");
    expect(hidden?.responseCount).toBeNull();
    expect(hidden?.computation).toBeNull();
  });

  it("distingue média ponderada por resposta da média entre órgãos", () => {
    const large = uniform("grande", 30, 4);
    const small = uniform("pequeno", 10, 2);
    const pooled = publishStateAggregate([large, small], 10);
    const unweighted = unweightedOrganizationIqvst([large, small]);
    expect(pooled.computation?.display).toBe("3,50");
    expect(unweighted?.display).toBe("3,00");
  });

  it("omite eixo complementar quando a fórmula revelaria o eixo suprimido", () => {
    const axes = AXIS_CODES.map((axis) => ({
      axis,
      responseCount: axis === "E1" ? 4 : 40,
      mean: Decimal.fromString(axis === "E1" ? "1" : "4"),
    }));
    const iqvst = computeIqvst({
      E1: Decimal.fromString("1"),
      E2: Decimal.fromString("4"),
      E3: Decimal.fromString("4"),
      E4: Decimal.fromString("4"),
      E5: Decimal.fromString("4"),
      E6: Decimal.fromString("4"),
    });
    const decision = protectPublication(40, axes, iqvst.iqvst);
    expect(decision.axes.find((axis) => axis.axis === "E1")?.suppression).toBe("primary");
    expect(decision.axes.find((axis) => axis.axis === "E6")?.suppression).toBe("complementary");
    expect(decision.iqvstStatus).toBe("published");
    expect(decision.axes.filter((axis) => axis.status === "published")).toHaveLength(4);
  });

  it("não revela quantidade quando o órgão inteiro está abaixo do limite", () => {
    const axes = AXIS_CODES.map((axis) => ({
      axis,
      responseCount: 8,
      mean: Decimal.fromString("3"),
    }));
    const decision = protectPublication(8, axes, Decimal.fromString("3"));
    expect(decision.responseCount).toBeNull();
    expect(decision.iqvst).toBeNull();
    expect(decision.axes.every((axis) => axis.mean === null)).toBe(true);
  });

  it("trata ausência de respostas de forma diferente da supressão", () => {
    const axes = AXIS_CODES.map((axis) => ({ axis, responseCount: 0, mean: null }));
    const decision = protectPublication(0, axes, null);
    expect(decision.iqvstStatus).toBe("no_data");
    expect(decision.responseCount).toBe(0);
  });

  it("não publica distribuição sem autorização explícita", () => {
    expect(canPublishDistribution(40, false)).toBe(false);
    expect(canPublishDistribution(9, true)).toBe(false);
    expect(canPublishDistribution(10, true)).toBe(true);
  });

  it("só calcula taxa de participação com base confiável e grupo divulgável", () => {
    expect(participationRate(40, null).status).toBe("unavailable");
    expect(participationRate(4, 100).status).toBe("unavailable");
    expect(participationRate(40, 30)).toEqual({ status: "unavailable", reason: "inconsistent_counts" });
    expect(participationRate(40, 100)).toMatchObject({ status: "available", label: "40,0%" });
  });

  it("separa credencial consumida da resposta e impede reenvio", async () => {
    expect(validateParticipationTokenFormat("12345678901").ok).toBe(false);
    expect(validateParticipationTokenFormat("pessoa@exemplo.gov.br").ok).toBe(false);
    const token = "credencial-valida-2026-pqvst";
    const pepper = "segredo-institucional-de-teste-32";
    const hash = await hashParticipationToken(token, pepper);
    expect(hash).toHaveLength(64);
    expect(await hashParticipationToken(token, pepper)).toBe(hash);
    const consumed = consumeCredential(
      {
        id: "cred-1",
        cycleId: "ciclo-1",
        organizationId: "org-1",
        tokenHash: hash,
        status: "issued",
        consumedAt: null,
      },
      "2026-10-26T12:00:00.000Z",
    );
    expect(consumed.ok).toBe(true);
    if (consumed.ok) {
      expect(consumed.value.status).toBe("consumed");
      expect(Object.hasOwn(consumed.value, "submissionId")).toBe(false);
      expect(consumeCredential(consumed.value, "2026-10-26T12:01:00.000Z").ok).toBe(false);
    }
  });
});
