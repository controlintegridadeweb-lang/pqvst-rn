"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { LIKERT_SCALES, SCALE_LABELS, type ImportedQuestion, type LikertScale, type QuestionnaireImport } from "@/domain/surveys/questionnaire";
import { validateAnswers, type AnswerValue } from "@/domain/surveys/response";

const STORAGE_KEY = "pqvst-rascunho-local";

interface Step {
  id: string;
  kicker: string | null;
  title: string;
  questions: ImportedQuestion[];
}

function groups(questions: readonly ImportedQuestion[]): Step[] {
  const steps: Step[] = [];
  const ordered = [...questions].sort((a, b) => a.order - b.order);
  if (ordered.some((question) => question.section)) {
    for (const question of ordered) {
      const title = question.section ?? "Questionário";
      const current = steps[steps.length - 1];
      if (current && current.title === title) {
        current.questions.push(question);
        continue;
      }
      const axis = question.axisCode ? OFFICIAL_AXES.find((item) => item.code === question.axisCode) : undefined;
      steps.push({ id: title, kicker: axis?.name ?? null, title, questions: [question] });
    }
    return steps;
  }

  for (const axis of OFFICIAL_AXES) {
    const items = ordered.filter((question) => question.axisCode === axis.code);
    if (items.length > 0) steps.push({ id: axis.code, kicker: null, title: axis.name, questions: items });
  }
  const extra = ordered.filter((question) => question.axisCode === null);
  if (extra.length > 0) steps.push({ id: "extra", kicker: null, title: "Outras informações", questions: extra });
  return steps;
}

const TAB_LABELS: Record<string, string> = {
  "Órgão e setor": "Órgão",
  "Bem-estar geral e saúde mental": "Bem-estar",
  "Hábitos saudáveis": "Hábitos",
  "Ambiência e ergonomia": "Ambiência",
  "Equipamentos de Proteção Individual (EPIs)": "EPIs",
  "Desenvolvimento Pessoal e Profissional": "Desenvolvimento",
  "Lazer e Vida Social": "Lazer",
  "Práticas de Gestão do Trabalho": "Gestão",
  "Cultura Prevencionista": "Prevenção",
  "Preservação e Sustentabilidade": "Sustentabilidade",
};

function tabLabel(title: string) {
  return TAB_LABELS[title] ?? title;
}

function labelFor(question: ImportedQuestion, value: AnswerValue): string {
  if (typeof value === "number" && LIKERT_SCALES.includes(question.scale as LikertScale)) {
    return SCALE_LABELS[question.scale as LikertScale].find((item) => item.value === value)?.label ?? String(value);
  }
  if (value === null || value === "") return "Não respondida";
  return String(value);
}

function answered(question: ImportedQuestion, answers: Record<string, AnswerValue>) {
  const value = answers[question.code];
  return value !== undefined && value !== "";
}

export function SurveyWizard({
  questionnaire,
  onSubmit,
}: {
  questionnaire: QuestionnaireImport;
  onSubmit: (answers: Record<string, AnswerValue>) => void | Promise<string | null | undefined | void>;
}) {
  const steps = useMemo(() => groups(questionnaire.questions), [questionnaire.questions]);
  const reviewIndex = steps.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [keepDraft, setKeepDraft] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const review = step === reviewIndex;
  const current = steps[step];

  function persist(next: Record<string, AnswerValue>, enabled: boolean) {
    if (!enabled) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function setAnswer(code: string, value: AnswerValue) {
    const next = { ...answers, [code]: value };
    setAnswers(next);
    persist(next, keepDraft);
  }

  function firstMissing(): { index: number; message: string } | null {
    for (const [index, group] of steps.entries()) {
      const missing = group.questions.find((question) => question.required && !answered(question, answers));
      if (missing) return { index, message: `Responda: ${missing.prompt}` };
    }
    return null;
  }

  function openTab(index: number) {
    if (index === reviewIndex) {
      const problem = firstMissing();
      if (problem) {
        setError(problem.message);
        setStep(problem.index);
        return problem.index;
      }
    }
    setError(null);
    setStep(index);
    return index;
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = index === reviewIndex ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? reviewIndex : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = reviewIndex;
    else return;
    event.preventDefault();
    const opened = openTab(next);
    requestAnimationFrame(() => document.getElementById(`aba-${opened}`)?.focus());
  }

  async function confirm() {
    if (submitted || pending) return;
    const problem = firstMissing();
    if (problem) {
      setError(problem.message);
      setStep(problem.index);
      return;
    }
    const result = validateAnswers(questionnaire, answers);
    if (!result.ok) {
      setError(result.error.message || "Revise as respostas obrigatórias.");
      return;
    }
    setPending(true);
    setError(null);
    const errorMessage = await onSubmit(result.value);
    if (errorMessage) {
      setPending(false);
      setError(errorMessage);
      return;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    setSubmitted(true);
    setPending(false);
  }

  const fieldClass =
    "survey-field w-full rounded-xl border border-[#eadfe4] bg-[#fcfcfc] px-3.5 py-3 text-base text-ink";
  const tabClass = (selected: boolean) =>
    selected
      ? "survey-tab relative z-10 -mb-px rounded-t-xl bg-pine px-4 py-2.5 text-sm font-medium text-white"
      : "survey-tab relative rounded-t-xl bg-white/70 px-4 py-2.5 text-sm font-medium text-[#5c5c5c] hover:bg-white";

  return (
    <section aria-labelledby="wizard-title">
      <div className="flex flex-wrap items-end gap-1.5 px-2" role="tablist" aria-label="Seções do questionário">
        {steps.map((group, index) => {
          const selected = step === index;
          return (
            <button
              key={group.id}
              id={`aba-${index}`}
              type="button"
              role="tab"
              aria-label={group.title}
              aria-selected={selected}
              aria-controls={`painel-${index}`}
              tabIndex={selected ? 0 : -1}
              className={tabClass(selected)}
              onClick={() => openTab(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {tabLabel(group.title)}
            </button>
          );
        })}
        <button
          id={`aba-${reviewIndex}`}
          type="button"
          role="tab"
          aria-selected={review}
          aria-controls="painel-revisao"
          tabIndex={review ? 0 : -1}
          className={tabClass(review)}
          onClick={() => openTab(reviewIndex)}
          onKeyDown={(event) => onTabKeyDown(event, reviewIndex)}
        >
          Revisão
        </button>
      </div>

      <div className="rounded-2xl border border-[#f0d4df] bg-white p-6 shadow-[0_16px_40px_rgba(193,24,91,0.08)] sm:p-8">
        {error ? (
          <p role="alert" className="mb-4 text-sm text-clay">
            {error}
          </p>
        ) : null}

        {!review && current ? (
          <div role="tabpanel" id={`painel-${step}`} aria-labelledby={`aba-${step}`}>
            <h2 id="wizard-title" className="text-2xl text-ink">
              {current.title}
            </h2>
            {current.kicker ? <p className="mt-1 text-sm text-[#7a7a7a]">{current.kicker}</p> : null}
            <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
              {current.questions.map((question) => (
                <div key={question.code} className="grid content-start gap-2">
                  <label htmlFor={question.code} className="text-sm font-medium text-[#3f3f3f]">
                    {question.prompt}
                  </label>
                  {LIKERT_SCALES.includes(question.scale as LikertScale) ? (
                    <select
                      id={question.code}
                      required={question.required}
                      className={fieldClass}
                      value={typeof answers[question.code] === "number" ? String(answers[question.code]) : ""}
                      onChange={(event) => setAnswer(question.code, event.target.value === "" ? "" : Number(event.target.value))}
                    >
                      <option value="">Selecione</option>
                      {SCALE_LABELS[question.scale as LikertScale].map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value} — {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={question.code}
                      required={question.required}
                      className={fieldClass}
                      value={typeof answers[question.code] === "string" ? String(answers[question.code]) : ""}
                      onChange={(event) => setAnswer(question.code, event.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div role="tabpanel" id="painel-revisao" aria-labelledby={`aba-${reviewIndex}`}>
            <h2 id="wizard-title" className="text-xl text-ink">
              Confira antes de enviar
            </h2>
            <ul className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              {questionnaire.questions.map((question) => (
                <li key={question.code}>
                  <span className="text-[#6b6b6b]">{question.prompt}</span>
                  <span className="mt-1 block text-ink">{labelFor(question, answers[question.code] ?? null)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 rounded-xl bg-pine px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              disabled={submitted || pending}
              onClick={confirm}
            >
              {pending ? "Enviando…" : submitted ? "Enviado" : "Confirmar envio"}
            </button>
          </div>
        )}

        <div className="mt-8 rounded-xl bg-[#fff7f9] px-4 py-3">
          <label className="flex items-start gap-3 text-sm leading-6 text-[#4d4d4d]">
            <input
              type="checkbox"
              className="mt-1 accent-pine"
              checked={keepDraft}
              onChange={(event) => {
                setKeepDraft(event.target.checked);
                persist(answers, event.target.checked);
              }}
            />
            <span>Guardar rascunho apenas neste navegador. Em computador compartilhado, deixe desmarcado.</span>
          </label>
          <button
            type="button"
            className="mt-2 text-sm font-semibold"
            onClick={() => {
              const stored = sessionStorage.getItem(STORAGE_KEY);
              if (!stored) {
                setError("Não há rascunho neste navegador.");
                return;
              }
              try {
                const parsed: unknown = JSON.parse(stored);
                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                  throw new Error("rascunho inválido");
                }
                setAnswers(parsed as Record<string, AnswerValue>);
                setError(null);
              } catch {
                setError("O rascunho deste navegador não pôde ser lido.");
              }
            }}
          >
            Recuperar rascunho deste navegador
          </button>
        </div>
      </div>
    </section>
  );
}
