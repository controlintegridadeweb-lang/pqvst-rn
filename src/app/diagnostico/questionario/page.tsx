import { Suspense } from "react";
import Link from "next/link";
import { OfficialSurvey } from "@/app/diagnostico/questionario/official-survey";
import { requireParticipation } from "@/app/diagnostico/guard";
import { getOfficialQuestionnaire } from "@/domain/surveys/questionnaire";

export const metadata = { title: "Questionário" };

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<p className="px-5 py-12 text-sm text-muted">Abrindo o questionário…</p>}>
      <Questionnaire />
    </Suspense>
  );
}

async function Questionnaire() {
  await requireParticipation();
  const official = getOfficialQuestionnaire();

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
          <p className="text-sm font-medium text-pine">Diagnóstico</p>
          <h1 className="mt-3 max-w-3xl text-4xl text-ink md:text-5xl">Questionário de qualidade de vida no trabalho.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#3f3f3f]">
            {official
              ? "As perguntas seguem o formulário do programa. A percepção usa a escala de concordância, de discordo totalmente a concordo totalmente."
              : "Nenhuma versão aprovada foi importada. A coleta real permanece fechada."}
          </p>
          <Link
            href="/privacidade"
            className="mt-8 inline-block rounded-full border border-[#d4d4d4] bg-white px-6 py-2.5 text-sm font-medium text-ink no-underline"
          >
            Como os dados são tratados
          </Link>
        </div>
        <div className="h-1 bg-[#d12d6c]" />
      </section>
      {official ? (
        <section className="bg-[#fde7f0]">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <OfficialSurvey />
          </div>
        </section>
      ) : null}
    </>
  );
}
