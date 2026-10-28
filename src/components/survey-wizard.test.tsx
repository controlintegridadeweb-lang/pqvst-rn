import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SurveyWizard } from "@/components/survey-wizard";
import type { QuestionnaireImport } from "@/domain/surveys/questionnaire";

const questionnaire: QuestionnaireImport = {
  origin: "official_import",
  versionLabel: "teste-nao-oficial",
  sourceDocument: "Arquivo sintético de teste",
  sourceUrl: null,
  questions: [
    {
      code: "A",
      prompt: "Pergunta do primeiro eixo",
      axisCode: "E1",
      order: 1,
      required: true,
      scale: "agreement",
      scoring: "scoreable_positive",
      section: null,
    },
    {
      code: "B",
      prompt: "Pergunta do segundo eixo",
      axisCode: "E2",
      order: 2,
      required: true,
      scale: "frequency",
      scoring: "scoreable_positive",
      section: null,
    },
  ],
};

describe("motor do questionário", () => {
  it("impede etapa incompleta, revisa e envia uma única vez", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SurveyWizard questionnaire={questionnaire} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("tab", { name: "Revisão" }));
    expect(screen.getByRole("alert").textContent).toContain("Pergunta do primeiro eixo");

    await user.click(screen.getByRole("tab", { name: "Desenvolvimento de Pessoas" }));
    expect(screen.getByLabelText("Pergunta do segundo eixo")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Revisão" }));
    expect(screen.getByRole("alert").textContent).toContain("Pergunta do primeiro eixo");

    await user.selectOptions(screen.getByLabelText("Pergunta do primeiro eixo"), "5");
    await user.click(screen.getByRole("tab", { name: "Desenvolvimento de Pessoas" }));
    await user.click(screen.getByRole("tab", { name: "Revisão" }));
    expect(screen.getByRole("alert").textContent).toContain("Pergunta do segundo eixo");

    await user.selectOptions(screen.getByLabelText("Pergunta do segundo eixo"), "5");
    await user.click(screen.getByRole("tab", { name: "Revisão" }));
    const confirm = screen.getByRole("button", { name: "Confirmar envio" });
    expect(confirm).toHaveProperty("disabled", false);
    await user.click(confirm);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Enviado" })).toHaveProperty("disabled", true);
  });
});
