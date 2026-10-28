import { Suspense } from "react";
import Link from "next/link";
import { clearCredential } from "@/app/diagnostico/actions";
import { TokenCheck } from "@/app/diagnostico/token-check";
import { readValidParticipation } from "@/infrastructure/participation/gate";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export const metadata = { title: "Participar" };

export default function DiagnosisAccessPage() {
  if (!isAdminEntryOpen()) {
    return (
      <section className="bg-[#fff7f9] px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium text-pine">Servidor</p>
          <h1 className="mt-3 text-3xl text-ink">A coleta ainda não está aberta nesta instalação.</h1>
          <p className="mt-4 text-base leading-7 text-[#3f3f3f]">
            A credencial só avança quando a base institucional está configurada e o ciclo do órgão está aberto.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#fff7f9] px-4 py-10 md:py-16">
      <Suspense fallback={<p className="text-center text-sm text-muted">Abrindo a credencial…</p>}>
        <DiagnosisEntry />
      </Suspense>
    </section>
  );
}

async function DiagnosisEntry() {
  const admitted = await readValidParticipation();

  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] md:min-h-[520px] md:grid-cols-2">
      <div className="flex items-center px-8 py-12 sm:px-12">
        <div className="w-full">
          <p className="text-center text-sm font-medium text-pine">Servidor</p>
          <h1 className="mt-3 text-center text-xl font-semibold text-ink underline decoration-2 underline-offset-4">
            Credencial
          </h1>
          {admitted ? (
            <div className="mt-6 grid gap-4 text-center">
              <p className="text-sm leading-6 text-muted">
                A credencial foi aceita. O próximo passo são as instruções e, depois, o questionário.
              </p>
              <Link
                href="/diagnostico/instrucoes"
                className="mx-auto rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white no-underline uppercase"
              >
                Continuar
              </Link>
              <form action={clearCredential}>
                <button type="submit" className="text-sm text-muted underline">
                  Usar outra credencial
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="mt-4 text-center text-sm leading-6 text-muted">
                Entre com a credencial do seu órgão. Ela verifica se ainda há uma participação disponível e não pede nome,
                CPF ou matrícula.
              </p>
              <TokenCheck />
            </>
          )}
        </div>
      </div>
      <aside className="flex min-h-80 items-center justify-center bg-[#c2185b] px-8 py-14 text-white">
        <div className="max-w-xs text-center">
          <h2 className="text-2xl font-semibold tracking-[0.12em]">ANTES DE RESPONDER</h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-left text-sm leading-6 text-white">
            <li>Informe a credencial nesta tela.</li>
            <li>Leia a finalidade e a privacidade.</li>
            <li>Responda por etapas, em tela simples.</li>
            <li>Revise antes de confirmar.</li>
            <li>A mesma credencial não envia duas vezes.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
