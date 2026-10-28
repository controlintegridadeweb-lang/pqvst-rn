import { describe, expect, it } from "vitest";
import { Decimal, meanDecimals } from "@/domain/shared/decimal";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { classifyIqvst } from "@/domain/indicators/classification";
import { axisMeanFromQuestions, computeIqvst, questionMean } from "@/domain/indicators/iqvst";

function means(values: Record<AxisCode, string | null>) {
  const axisMeans = {} as Record<AxisCode, Decimal | null>;
  for (const axis of AXIS_CODES) {
    const value = values[axis];
    axisMeans[axis] = value === null ? null : Decimal.fromString(value);
  }
  return computeIqvst(axisMeans);
}

describe("IQVST", () => {
  it("reproduz o exemplo do guia: 3,77 e classificação Boa", () => {
    const result = means({
      E1: "4.2",
      E2: "3.8",
      E3: "3.5",
      E4: "4.0",
      E5: "3.2",
      E6: "3.9",
    });
    expect(result.reason).toBe("computed");
    expect(result.display).toBe("3,77");
    expect(result.classification).toBe("boa");
    expect(result.classificationLabel).toBe("Boa");
  });

  it("dá o mesmo peso aos seis eixos, mesmo com quantidades diferentes de perguntas", () => {
    const crowded = axisMeanFromQuestions([
      Decimal.fromString("5"),
      Decimal.fromString("5"),
      Decimal.fromString("5"),
      Decimal.fromString("1"),
    ]);
    const single = axisMeanFromQuestions([Decimal.fromString("1")]);
    expect(crowded?.toFixed(2)).toBe("4.00");
    expect(single?.toFixed(2)).toBe("1.00");
    const result = means({
      E1: crowded?.toFixed(2) ?? null,
      E2: "1",
      E3: "1",
      E4: "1",
      E5: "1",
      E6: "1",
    });
    expect(result.display).toBe("1,50");
  });

  it("não transforma eixo sem respostas em zero", () => {
    const result = means({
      E1: "4",
      E2: "4",
      E3: null,
      E4: "4",
      E5: "4",
      E6: "4",
    });
    expect(result.iqvst).toBeNull();
    expect(result.display).toBeNull();
    expect(result.reason).toBe("missing_axis_data");
    expect(questionMean([])).toBeNull();
    expect(meanDecimals([])).toBeNull();
  });

  it("omite pergunta sem resposta e não a trata como zero", () => {
    const mean = axisMeanFromQuestions([
      questionMean([Decimal.fromInt(5)]) as Decimal,
    ]);
    expect(mean?.toFixed(2)).toBe("5.00");
  });

  it("rejeita valor fora da escala em vez de corrigi-lo", () => {
    expect(() => questionMean([Decimal.fromInt(0)])).toThrow(RangeError);
    expect(() => classifyIqvst(Decimal.fromString("5.01"))).toThrow(RangeError);
    expect(() => classifyIqvst(Decimal.fromString("0.99"))).toThrow(RangeError);
  });

  it.each([
    ["1.00", "muito_baixa"],
    ["1.49", "muito_baixa"],
    ["1.50", "baixa"],
    ["2.49", "baixa"],
    ["2.50", "necessidade_acoes_prioritarias"],
    ["3.49", "necessidade_acoes_prioritarias"],
    ["3.50", "boa"],
    ["4.49", "boa"],
    ["4.50", "excelente"],
    ["5.00", "excelente"],
  ] as const)("classifica a fronteira %s como %s", (value, expected) => {
    expect(classifyIqvst(Decimal.fromString(value))).toBe(expected);
  });

  it("documenta o arredondamento provisório nas fronteiras ambíguas", () => {
    expect(classifyIqvst(Decimal.fromString("4.494"))).toBe("boa");
    expect(classifyIqvst(Decimal.fromString("4.495"))).toBe("excelente");
    expect(classifyIqvst(Decimal.fromString("1.494"))).toBe("muito_baixa");
    expect(classifyIqvst(Decimal.fromString("1.495"))).toBe("baixa");
  });
});
