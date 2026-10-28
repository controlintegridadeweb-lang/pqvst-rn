import { Suspense } from "react";
import Link from "next/link";
import { requireParticipation } from "@/app/diagnostico/guard";

export const metadata = { title: "Instruções" };

const STEPS = [
  {
    title: "Por etapas",
    text: "Você pode navegar pelos eixos, corrigir uma resposta e revisar tudo antes do envio.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Rascunho local",
    text: "O rascunho não fica no servidor. Se estiver em um computador compartilhado, não grave as respostas neste navegador. Há uma opção explícita para recuperar um rascunho local, desligada por padrão.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Uso único",
    text: "Uma credencial usada não pode ser reenviada. Fechado o ciclo, o envio também se encerra.",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="8" cy="14" r="4" />
        <path d="M11.5 12.5 20 4m0 0h-3.5M20 4v3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function InstructionsPage() {
  return (
    <Suspense fallback={<p className="px-5 py-12 text-sm text-muted">Abrindo as instruções…</p>}>
      <InstructionsBody />
    </Suspense>
  );
}

async function InstructionsBody() {
  await requireParticipation();
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
          <p className="text-sm font-medium text-pine">Antes de responder</p>
          <h1 className="mt-3 max-w-3xl text-4xl text-ink md:text-5xl">O diagnóstico é institucional e confidencial.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#3f3f3f]">
            As respostas ajudam o órgão a enxergar condições de trabalho. Elas não compõem avaliação individual.
          </p>
          <Link
            href="/diagnostico/questionario"
            className="mt-8 inline-block rounded-full bg-pine px-6 py-2.5 text-base font-medium text-white no-underline"
          >
            Ir para o questionário
          </Link>
        </div>
        <div className="h-1 bg-[#d12d6c]" />
      </section>
      <section className="bg-[#fde7f0]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-12 lg:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.title} className="rounded-3xl bg-[#fff7f9] p-6">
              <span className="grid size-12 place-items-center rounded-full bg-pine text-white">{step.icon}</span>
              <h2 className="mt-4 text-xl text-ink">{step.title}</h2>
              <p className="mt-4 text-base leading-7 text-[#3f3f3f]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
