import { describe, expect, it } from "vitest";
import { AXIS_CODES } from "@/domain/indicators/axes";
import { assertCycleCanOpen, transitionCycle } from "@/domain/cycles/cycle";
import { authorize } from "@/domain/access/permissions";
import { createActionItem, transitionAction } from "@/domain/action-plans/action-item";
import { parseQuestionnaireImport, publicationReadiness, type QuestionnaireVersion } from "@/domain/surveys/questionnaire";
import { scoreSubmission } from "@/domain/surveys/response";
import { Decimal } from "@/domain/shared/decimal";
import { computeIqvst } from "@/domain/indicators/iqvst";
import { buildInstitutionalReport, compareCycles, reportToCsv } from "@/domain/reports/institutional-report";
import { canDrawHistory, emptyDashboard } from "@/domain/dashboards/view-model";

const questions = AXIS_CODES.map((axis, index) => ({
  code: `Q${index + 1}`,
  prompt: `Item sintético ${axis} usado apenas em teste.`,
  axisCode: axis,
  order: index + 1,
  required: true,
  scale: "agreement" as const,
  scoring: "scoreable_positive" as const,
  section: null,
}));

const questionnaire = {
  origin: "official_import" as const,
  versionLabel: "teste-nao-oficial",
  sourceDocument: "Arquivo sintético de teste",
  sourceUrl: null,
  questions: [
    ...questions,
    {
      code: "NEG",
      prompt: "Item negativo sintético, sem inversão.",
      axisCode: "E1" as const,
      order: 7,
      required: true,
      scale: "agreement" as const,
      scoring: "negative_pending_homologation" as const,
      section: null,
    },
    {
      code: "OPC",
      prompt: "Item opcional sintético.",
      axisCode: "E2" as const,
      order: 8,
      required: false,
      scale: "satisfaction" as const,
      scoring: "scoreable_positive" as const,
      section: null,
    },
    {
      code: "TXT",
      prompt: "Comentário sintético.",
      axisCode: null,
      order: 9,
      required: false,
      scale: "open_text" as const,
      scoring: "not_scoreable" as const,
      section: null,
    },
  ],
};

describe("questionário, acesso, ciclo, ação e relatório", () => {
  it("recusa questionário pontuável sem eixo e não inventa conteúdo oficial", () => {
    const missingAxis = parseQuestionnaireImport({
      ...questionnaire,
      questions: [{ ...questions[0], axisCode: null }],
    });
    expect(missingAxis.ok).toBe(false);
    const openScore = parseQuestionnaireImport({
      ...questionnaire,
      questions: [{ ...questionnaire.questions[8], scoring: "scoreable_positive" }],
    });
    expect(openScore.ok).toBe(false);
    const duplicate = parseQuestionnaireImport({
      ...questionnaire,
      questions: [questions[0], { ...questions[1], code: "Q1" }],
    });
    expect(duplicate.ok).toBe(false);
  });

  it("não pontua item negativo nem pergunta ausente como zero", () => {
    const answers = {
      Q1: 5,
      Q2: 5,
      Q3: 5,
      Q4: 5,
      Q5: 5,
      Q6: 5,
      NEG: 1,
      OPC: null,
      TXT: "",
    };
    const scored = scoreSubmission(questionnaire, answers);
    expect(scored.ok).toBe(true);
    if (scored.ok) {
      expect(scored.value.axisMeans.E1?.toFixed(2)).toBe("5.00");
      expect(scored.value.display).toBe("5,00");
    }
    expect(scoreSubmission(questionnaire, { ...answers, Q3: null }).ok).toBe(false);
  });

  it("impede abertura sem questionário aprovado e com eixo sem item pontuável", () => {
    expect(
      assertCycleCanOpen({ questionnaireStatus: "draft", hasScoreableQuestionOnEveryAxis: true }).ok,
    ).toBe(false);
    expect(
      assertCycleCanOpen({ questionnaireStatus: "approved", hasScoreableQuestionOnEveryAxis: false }).ok,
    ).toBe(false);
    expect(
      assertCycleCanOpen({ questionnaireStatus: "approved", hasScoreableQuestionOnEveryAxis: true }).ok,
    ).toBe(true);
    const version: QuestionnaireVersion = {
      id: "versao-teste",
      versionLabel: questionnaire.versionLabel,
      status: "approved",
      sourceDocument: questionnaire.sourceDocument,
      sourceUrl: null,
      questions: questionnaire.questions.filter((question) => question.axisCode !== "E6"),
    };
    expect(publicationReadiness(version).ok).toBe(false);
  });

  it("restringe transições do ciclo e exige justificativa para despublicar", () => {
    expect(transitionCycle({ from: "draft", to: "published" }).ok).toBe(false);
    expect(transitionCycle({ from: "open", to: "closed" }).ok).toBe(true);
    expect(transitionCycle({ from: "published", to: "processed" }).ok).toBe(false);
    expect(transitionCycle({ from: "published", to: "processed", justification: "Correção metodológica aprovada." }).ok).toBe(true);
  });

  it("impede gestor de ler outro órgão e ninguém de ler resposta bruta", () => {
    const manager = { kind: "org_manager" as const, userId: "gestor-1", organizationIds: ["org-a"] };
    expect(authorize(manager, { action: "read_org_indicators", organizationId: "org-b" }).ok).toBe(false);
    expect(authorize(manager, { action: "manage_action_plan", organizationId: "org-a" }).ok).toBe(true);
    expect(authorize(manager, { action: "publish_results" }).ok).toBe(false);
    expect(authorize(manager, { action: "issue_credentials", organizationId: "org-a" }).ok).toBe(true);
    expect(authorize(manager, { action: "issue_credentials", organizationId: "org-b" }).ok).toBe(false);
    expect(authorize(manager, { action: "manage_cycles" }).ok).toBe(false);
    expect(authorize(manager, { action: "manage_members", organizationId: "org-a" }).ok).toBe(false);
    expect(authorize({ kind: "state_admin", userId: "admin-1" }, { action: "manage_members" }).ok).toBe(true);
    expect(authorize({ kind: "state_admin", userId: "admin-1" }, { action: "read_raw_answers" }).ok).toBe(false);
    expect(authorize({ kind: "anonymous" }, { action: "read_org_indicators", organizationId: "org-a" }).ok).toBe(false);
    expect(authorize({ kind: "state_admin", userId: "admin-1" }, { action: "manage_cycles" }).ok).toBe(true);
  });

  it("preserva histórico da ação e exige justificativa para cancelar", () => {
    const created = createActionItem(
      "acao-1",
      {
        organizationId: "org-a",
        cycleId: "ciclo-1",
        axis: "E4",
        problem: "Comunicação interna fragmentada",
        objective: "Tornar as decisões compreensíveis",
        description: "Instituir roteiro de retorno das deliberações",
        institutionalOwner: "Comissão Executiva Local",
        dueDate: "2026-12-15",
        expectedResult: "Rotina de comunicação adotada",
        monitoringIndicator: "Percentual de ações com retorno registrado",
      },
      "2026-10-26T12:00:00.000Z",
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const previous = created.value.updates;
    const cancelled = transitionAction(created.value, "cancelled", "2026-10-27T12:00:00.000Z", "curta");
    expect(cancelled.ok).toBe(false);
    const started = transitionAction(created.value, "in_progress", "2026-10-27T12:00:00.000Z", "Execução iniciada pela comissão.");
    expect(started.ok).toBe(true);
    expect(previous).toHaveLength(1);
    if (started.ok) {
      expect(started.value.updates).toHaveLength(2);
      expect(started.value.monitoringIndicator).not.toMatch(/IQVST/);
    }
  });

  it("mantém relatório e cálculo consistentes, sem dados individuais", () => {
    const computation = computeIqvst({
      E1: Decimal.fromString("4.2"),
      E2: Decimal.fromString("3.8"),
      E3: Decimal.fromString("3.5"),
      E4: Decimal.fromString("4.0"),
      E5: Decimal.fromString("3.2"),
      E6: Decimal.fromString("3.9"),
    });
    const comparison = compareCycles(
      { cycleName: "2025", methodologyId: "m1", iqvst: Decimal.fromString("3.50") },
      { cycleName: "2026", methodologyId: "m2", iqvst: computation.iqvst },
    );
    expect(comparison.direction).toBe("not_comparable");
    const report = buildInstitutionalReport({
      organizationName: "Órgão de teste",
      cycleName: "2026",
      methodologyId: computation.policyId,
      generatedAt: "2026-10-26",
      responseCount: 40,
      computation,
      suppressed: false,
      comparison: null,
      actions: [],
    });
    expect(report.iqvst).toBe("3,77");
    expect(report.classification).toBe("Boa");
    expect(report.narrative.join(" ")).toContain("Cultura Prevencionista");
    const csv = reportToCsv(report);
    expect(csv).toContain("3,77");
    expect(csv.toLowerCase()).not.toContain("cpf");
    expect(csv.toLowerCase()).not.toContain("email");
    const withheld = buildInstitutionalReport({
      organizationName: "Órgão de teste",
      cycleName: "2026",
      methodologyId: computation.policyId,
      generatedAt: "2026-10-26",
      responseCount: 4,
      computation,
      suppressed: true,
      comparison: null,
      actions: [],
    });
    expect(withheld.iqvst).toBeNull();
    expect(reportToCsv(withheld)).not.toContain("3,77");
  });

  it("não desenha evolução nem preenche ausência com zero", () => {
    const dashboard = emptyDashboard("no_publication");
    expect(dashboard.participatingOrganizations).toBeNull();
    expect(dashboard.iqvstLabel).toBeNull();
    expect(dashboard.axes).toHaveLength(6);
    expect(canDrawHistory([{ cycle: "2026", iqvst: 3.77, comparable: true }])).toBe(false);
    expect(canDrawHistory([
      { cycle: "2025", iqvst: 3.5, comparable: false },
      { cycle: "2026", iqvst: 3.77, comparable: false },
    ])).toBe(false);
  });
});
