import { z } from "zod";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { fail, ok, type DomainResult } from "@/domain/shared/result";
import { OFFICIAL_FORM_SOURCE } from "@/domain/surveys/official-form";

export const LIKERT_SCALES = ["satisfaction", "frequency", "agreement"] as const;
export type LikertScale = (typeof LIKERT_SCALES)[number];

export const QUESTION_SCALES = [...LIKERT_SCALES, "open_text", "single_choice"] as const;
export type QuestionScale = (typeof QUESTION_SCALES)[number];

export const SCORING_MODES = [
  "scoreable_positive",
  "not_scoreable",
  "negative_pending_homologation",
] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];

export const SCALE_LABELS: Record<LikertScale, readonly { value: 1 | 2 | 3 | 4 | 5; label: string }[]> = {
  satisfaction: [
    { value: 1, label: "Muito insatisfatório" },
    { value: 2, label: "Insatisfatório" },
    { value: 3, label: "Regular" },
    { value: 4, label: "Satisfatório" },
    { value: 5, label: "Muito satisfatório" },
  ],
  frequency: [
    { value: 1, label: "Nunca" },
    { value: 2, label: "Raramente" },
    { value: 3, label: "Às vezes" },
    { value: 4, label: "Frequentemente" },
    { value: 5, label: "Sempre" },
  ],
  agreement: [
    { value: 1, label: "Discordo totalmente" },
    { value: 2, label: "Discordo parcialmente" },
    { value: 3, label: "Nem discordo nem concordo" },
    { value: 4, label: "Concordo parcialmente" },
    { value: 5, label: "Concordo totalmente" },
  ],
};

const questionSchema = z
  .object({
    code: z.string().trim().min(1).max(40),
    prompt: z.string().trim().min(3).max(1000),
    axisCode: z.enum(AXIS_CODES).nullable(),
    order: z.number().int().positive(),
    required: z.boolean(),
    scale: z.enum(QUESTION_SCALES),
    scoring: z.enum(SCORING_MODES),
    section: z.string().trim().min(1).max(160).nullable(),
  })
  .superRefine((question, context) => {
    const likert = LIKERT_SCALES.includes(question.scale as LikertScale);
    if (question.scoring === "scoreable_positive") {
      if (!likert || question.axisCode === null) {
        context.addIssue({
          code: "custom",
          message: "Somente item de escala oficial, vinculado a um eixo, pode ser pontuável.",
          path: ["scoring"],
        });
      }
    }
    if (!likert && question.scoring !== "not_scoreable") {
      context.addIssue({
        code: "custom",
        message: "Texto aberto e caracterização não entram no IQVST.",
        path: ["scoring"],
      });
    }
    if (question.scoring === "negative_pending_homologation" && !likert) {
      context.addIssue({
        code: "custom",
        message: "Item negativo pendente precisa usar uma das três escalas oficiais.",
        path: ["scoring"],
      });
    }
  });

export const questionnaireImportSchema = z
  .object({
    origin: z.literal("official_import"),
    versionLabel: z.string().trim().min(1).max(80),
    sourceDocument: z.string().trim().min(5).max(300),
    sourceUrl: z.string().trim().url().nullable(),
    questions: z.array(questionSchema).min(1).max(500),
  })
  .superRefine((questionnaire, context) => {
    const codes = new Set<string>();
    const orders = new Set<number>();
    questionnaire.questions.forEach((question, index) => {
      if (codes.has(question.code)) {
        context.addIssue({
          code: "custom",
          message: `Código de pergunta repetido: ${question.code}`,
          path: ["questions", index, "code"],
        });
      }
      if (orders.has(question.order)) {
        context.addIssue({
          code: "custom",
          message: `Ordem de pergunta repetida: ${question.order}`,
          path: ["questions", index, "order"],
        });
      }
      codes.add(question.code);
      orders.add(question.order);
    });
  });

export type QuestionnaireImport = z.infer<typeof questionnaireImportSchema>;
export type ImportedQuestion = QuestionnaireImport["questions"][number];

export interface QuestionnaireVersion {
  id: string;
  versionLabel: string;
  status: "draft" | "in_review" | "approved" | "retired";
  sourceDocument: string;
  sourceUrl: string | null;
  questions: readonly ImportedQuestion[];
}

export function parseQuestionnaireImport(input: unknown): DomainResult<QuestionnaireImport> {
  const parsed = questionnaireImportSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    return fail("invalid_questionnaire", message || "O arquivo do questionário é inválido.");
  }
  return ok(parsed.data);
}

export function axesMissingScoreableQuestions(questions: readonly ImportedQuestion[]): AxisCode[] {
  return AXIS_CODES.filter(
    (axis) =>
      !questions.some(
        (question) => question.axisCode === axis && question.scoring === "scoreable_positive",
      ),
  );
}

export function publicationReadiness(version: QuestionnaireVersion): DomainResult<true> {
  if (version.status !== "approved") {
    return fail("questionnaire_not_approved", "A versão ainda não está aprovada.");
  }
  const missing = axesMissingScoreableQuestions(version.questions);
  if (missing.length > 0) {
    return fail(
      "axes_without_scoreable_items",
      `Não há pergunta pontuável em: ${missing.join(", ")}. O IQVST não pode ser publicado assim.`,
    );
  }
  return ok(true);
}

/** Perguntas do formulário exportado. Não inclui carimbo, e-mail nem a coluna de pontuação. */
export function getOfficialQuestionnaire(): QuestionnaireVersion | null {
  const parsed = parseQuestionnaireImport(OFFICIAL_FORM_SOURCE);
  if (!parsed.ok) return null;
  return {
    id: "pqvst-formulario",
    versionLabel: parsed.value.versionLabel,
    status: "approved",
    sourceDocument: parsed.value.sourceDocument,
    sourceUrl: parsed.value.sourceUrl,
    questions: parsed.value.questions,
  };
}
