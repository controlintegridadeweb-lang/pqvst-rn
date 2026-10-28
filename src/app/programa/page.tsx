import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = { title: "O programa" };

function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffcc00] text-ink">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

export default function ProgramPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
          <span className="absolute top-6 -right-12 size-32 rounded-full bg-[#ffcc00]" />
          <span className="absolute -right-24 bottom-1 size-64 rounded-full bg-[#ffcc00]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-end gap-6 px-5 pt-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10 lg:pt-10">
          <img
            src="/idosa-sorrindo.jpg"
            alt="Mulher negra idosa sorrindo, diante de um círculo amarelo"
            className="order-2 mx-auto h-auto w-full max-w-md lg:order-1 lg:mx-0 lg:max-w-[30rem]"
          />
          <div className="order-1 max-w-xl pb-8 lg:order-2 lg:pr-36 lg:pb-10">
            <p className="text-sm font-medium text-pine">Institucional</p>
            <h1 className="mt-2 text-3xl text-ink md:text-4xl">Um compromisso com a qualidade de vida no trabalho.</h1>
            <p className="mt-3 text-base leading-7 text-[#3f3f3f]">
              O Programa de Qualidade de Vida e Saúde no Trabalho (PQVT) integra a política de integridade do Rio
              Grande do Norte. Por meio da escuta dos servidores e da análise de indicadores, contribui para identificar
              necessidades e orientar melhorias nas condições de trabalho dos órgãos estaduais.
            </p>
            <Link
              href="/metodologia"
              className="mt-6 inline-block rounded-full border border-[#d4d4d4] bg-white px-6 py-2.5 text-sm font-medium text-ink no-underline"
            >
              Saiba mais
            </Link>
          </div>
        </div>
        <div className="h-1 bg-[#d12d6c]" />
      </section>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-start gap-14 px-5 py-14 lg:grid-cols-2 lg:gap-16">
          <div className="grid items-start gap-8">
            <div>
              <h2 className="text-3xl text-ink">Para que serve</h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[#6b6b6b]">
                Calcula o IQVST, mostra os eixos e registra providências, sem avaliar pessoas.
              </p>
            </div>
            <ul className="grid gap-6">
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M4 19V5M4 19h16" strokeLinecap="round" />
                  <path d="M8 15v-4M12 15V8M16 15v-6" strokeLinecap="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">Calcular o IQVST de cada órgão e do conjunto estadual.</p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M12 21s-6-4.4-6-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-6 10-6 10z" strokeLinejoin="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">
                  Mostrar forças e fragilidades dos seis eixos, sem ranking depreciativo.
                </p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">Comparar ciclos quando a metodologia permanecer comparável.</p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M8 6h11M8 12h11M8 18h11M5 6h.01M5 12h.01M5 18h.01" strokeLinecap="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">
                  Registrar planos de ação e distinguí-los do indicador de percepção.
                </p>
              </li>
            </ul>
          </div>
          <div className="grid items-start gap-8">
            <div>
              <h2 className="text-3xl text-ink">Quem participa</h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[#6b6b6b]">
                Órgão, comissão, servidor e visitante têm papéis diferentes na plataforma.
              </p>
            </div>
            <ul className="grid gap-6">
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M4 20h16M6 20V9l6-5 6 5v11" strokeLinejoin="round" />
                  <path d="M10 20v-6h4v6" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">A CONTROL/RN administra a plataforma no âmbito do PIC/RN.</p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM3 20a5 5 0 0 1 10 0m1-1a5 5 0 0 1 8 1" strokeLinecap="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">A Comissão Executiva Local acompanha o próprio órgão.</p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" strokeLinecap="round" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">
                  O servidor responde ao diagnóstico do órgão ao qual está vinculado.
                </p>
              </li>
              <li className="flex items-center gap-4">
                <Mark>
                  <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
                  <circle cx="12" cy="12" r="2.5" />
                </Mark>
                <p className="text-base leading-7 text-[#3f3f3f]">
                  O visitante vê somente o que tiver sido autorizado para divulgação.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
