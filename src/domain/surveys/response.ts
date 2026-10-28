import { z } from "zod";
import { Decimal } from "@/domain/shared/decimal";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { questionMean, axisMeanFromQuestions, computeIqvst, type IqvstComputation } from "@/domain/indicators/iqvst";
import { fail, ok, type DomainResult } from "@/domain/shared/result";
import {
  LIKERT_SCALES,
  type ImportedQuestion,
  type LikertScale,
  type QuestionnaireImport,
} from "@/domain/surveys/questionnaire";

export type AnswerValue = number | string | null;

export function answerSchema(questions: readonly ImportedQuestion[]) {
  const shape: Record<string, z.ZodType<AnswerValue>> = {};
  for (const question of questions) {
    if (LIKERT_SCALES.includes(question.scale as LikertScale)) {
      const likert = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
      shape[question.code] = question.required ? likert : likert.nullable();
      continue;
    }
    const text = z.string().trim().min(1).max(2000);
    shape[question.code] = question.required ? text : z.union([text, z.literal(""), z.null()]);
  }
  return z.object(shape).strict();
}

export function validateAnswers(
  questionnaire: QuestionnaireImport,
  answers: unknown,
): DomainResult<Record<string, AnswerValue>> {
  const parsed = answerSchema(questionnaire.questions).safeParse(answers);
  if (!parsed.success) {
    return fail(
      "invalid_answers",
      parsed.error.issues.map((issue) => issue.message).join(" ") || "Há respostas inválidas.",
    );
  }
  return ok(parsed.data);
}

export function scoreSubmission(
  questionnaire: QuestionnaireImport,
  answers: Record<string, AnswerValue>,
): DomainResult<IqvstComputation> {
  const validated = validateAnswers(questionnaire, answers);
  if (!validated.ok) return validated;

  const questionValues = new Map<string, Decimal[]>();

  for (const question of questionnaire.questions) {
    if (question.scoring !== "scoreable_positive" || question.axisCode === null) {
      continue;
    }
    const answer = validated.value[question.code];
    if (typeof answer !== "number") {
      continue;
    }
    questionValues.set(question.code, [Decimal.fromInt(answer)]);
  }

  const means = Object.fromEntries(
    AXIS_CODES.map((axis) => {
      const questions = questionnaire.questions.filter(
        (question) => question.axisCode === axis && question.scoring === "scoreable_positive",
      );
      const questionMeans = questions
        .map((question) => questionMean(questionValues.get(question.code) ?? []))
        .filter((mean): mean is Decimal => mean !== null);
      return [axis, axisMeanFromQuestions(questionMeans)];
    }),
  ) as Record<AxisCode, Decimal | null>;

  return ok(computeIqvst(means));
}
