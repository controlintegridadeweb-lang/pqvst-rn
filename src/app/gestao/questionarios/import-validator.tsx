"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { parseQuestionnaireImport } from "@/domain/surveys/questionnaire";

const submitButton =
  "on-pink w-fit rounded-full bg-[#6d5efc] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(109,94,252,0.28)]";

const field =
  "min-h-44 w-full resize-y rounded-2xl border border-transparent bg-[#f7f6fd] px-4 py-3 text-sm leading-6 text-[#2c2a4a] outline-none focus:border-[#d9d4f5]";

interface ImportValues {
  fileText: string;
}

interface ImportResult {
  tone: "ok" | "error";
  lines: string[];
}

export function ImportValidator() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const form = useForm<ImportValues>({ defaultValues: { fileText: "" } });

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        if (values.fileText.length > 1_000_000) {
          setResult({ tone: "error", lines: ["O arquivo excede o limite de validação."] });
          return;
        }
        try {
          const parsed: unknown = JSON.parse(values.fileText);
          const checked = parseQuestionnaireImport(parsed);
          setResult(
            checked.ok
              ? {
                  tone: "ok",
                  lines: [
                    `Estrutura válida: ${checked.value.questions.length} itens na versão ${checked.value.versionLabel}.`,
                    "A validação ocorreu neste navegador. Nada foi publicado como questionário oficial.",
                  ],
                }
              : { tone: "error", lines: [checked.error.message] },
          );
        } catch {
          setResult({ tone: "error", lines: ["O conteúdo não é um JSON válido."] });
        }
      })}
    >
      <label htmlFor="fileText" className="text-sm font-medium text-[#5c5b73]">
        JSON do questionário importado
      </label>
      <textarea id="fileText" className={field} {...form.register("fileText", { required: true })} />
      <button type="submit" className={submitButton}>
        Validar importação
      </button>
      {result ? (
        <div
          role="status"
          className={
            result.tone === "ok"
              ? "grid gap-1 rounded-2xl bg-[#e8f5e9] px-4 py-3 text-sm leading-6 text-[#166534]"
              : "grid gap-1 rounded-2xl bg-[#fde7f0] px-4 py-3 text-sm leading-6 text-[#9f1239]"
          }
        >
          {result.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </form>
  );
}
