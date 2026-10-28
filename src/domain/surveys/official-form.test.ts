import { describe, expect, it } from "vitest";
import { AXIS_CODES } from "@/domain/indicators/axes";
import { OFFICIAL_FORM_SOURCE } from "@/domain/surveys/official-form";
import { axesMissingScoreableQuestions, getOfficialQuestionnaire, parseQuestionnaireImport } from "@/domain/surveys/questionnaire";

describe("formulário oficial", () => {
  it("aceita as perguntas da planilha e cobre os seis eixos", () => {
    const parsed = parseQuestionnaireImport(OFFICIAL_FORM_SOURCE);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.questions).toHaveLength(37);
    expect(parsed.value.questions.some((question) => /e-mail/i.test(question.prompt))).toBe(false);
    expect(parsed.value.questions[0]?.prompt).toBe("Informe qual órgão ou entidade você atua?");
    expect(parsed.value.questions[2]?.section).toBe("Bem-estar geral e saúde mental");
    expect(axesMissingScoreableQuestions(parsed.value.questions)).toEqual([]);
    expect(new Set(parsed.value.questions.map((question) => question.axisCode).filter(Boolean))).toEqual(new Set(AXIS_CODES));

    const official = getOfficialQuestionnaire();
    expect(official?.status).toBe("approved");
    expect(official?.questions).toHaveLength(37);
  });
});