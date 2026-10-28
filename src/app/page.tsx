import Link from "next/link";
import { OFFICIAL_AXES } from "@/domain/indicators/axes";

function AxisMark({ index }: { index: number }) {
  const paths = [
    "M12 21s-6-4.4-6-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-6 10-6 10z",
    "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0",
    "M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM3 20a5 5 0 0 1 10 0m1-1a5 5 0 0 1 8 1",
    "M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01",
    "M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z",
    "M12 21c4-3 7-6.2 7-10a7 7 0 0 0-14 0c0 3.8 3 7 7 10z",
  ];
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={paths[index] ?? paths[0]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-pine text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[#ee6f9d] lg:block"
          style={{ clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div className="relative grid items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-0 lg:py-20">
          <div className="flex flex-col gap-4 lg:py-2 lg:pr-[5vw] lg:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
            <p className="text-xs font-medium tracking-[0.14em] text-white uppercase">
              Programa de qualidade de vida e saúde no trabalho — PQVT
            </p>
            <h1 className="text-5xl text-white md:text-[3.25rem]">Qualidade de vida e saúde no trabalho</h1>
            <p className="text-xl font-medium text-white">
              Ouvir os servidores é o primeiro passo para melhorar o ambiente de trabalho.
            </p>
            <p className="text-base leading-7 text-white">
              O PQVT busca compreender como os servidores públicos percebem suas condições de trabalho e utilizar essas
              informações para orientar melhorias nos órgãos do Rio Grande do Norte.
            </p>
            <Link
              href="/programa"
              className="on-pink mt-2 inline-flex w-fit items-center gap-2 rounded-full border-2 border-white px-6 py-2.5 text-base font-medium text-white no-underline hover:bg-white hover:text-pine"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
              </svg>
              Conheça o programa
            </Link>
          </div>
          <div className="lg:py-2 lg:pr-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] lg:pl-[5vw]">
            <div className="rounded-3xl bg-[#f3f4f6] p-7 text-ink">
              <p className="text-center text-xs font-medium tracking-[0.16em] text-[#6b6b6b] uppercase">
                Acesso ao diagnóstico
              </p>
              <p className="mt-4 text-center text-base leading-7 text-[#3f3f3f]">
                A credencial do seu órgão abre as instruções e, em seguida, o questionário.
              </p>
              <Link
                href="/diagnostico"
                className="mt-5 block rounded-full bg-pine px-5 py-2.5 text-center text-base font-medium text-white no-underline"
              >
                Entrar com a credencial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#c2185b] text-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 md:grid-cols-3">
          {[
            ["01", "Participação", "Participe sem informar nome, CPF ou matrícula.", "/diagnostico"],
            [
              "02",
              "Resultados",
              "As respostas compõem o IQVST, calculado a partir de seis eixos com pesos iguais.",
              "/metodologia",
            ],
            ["03", "Privacidade", "Suas respostas não são associadas à sua identidade.", "/privacidade"],
          ].map(([number, title, text, href]) => (
            <Link
              key={href}
              href={href}
              className="on-pink rounded-lg border border-white bg-transparent p-6 no-underline"
            >
              <p className="text-3xl font-semibold text-white">{number}</p>
              <p className="mt-8 text-base font-semibold text-white">{title}</p>
              <p className="mt-2 text-base leading-7 text-white">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#f48fb1]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-center text-3xl text-pine-deep">Os seis eixos oficiais</h2>
          <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {OFFICIAL_AXES.map((axis, index) => {
              const featured = index % 3 === 1;
              return (
                <li key={axis.code} className="h-72">
                  <Link
                    href="/metodologia"
                    className={
                      featured
                        ? "on-pink flex h-full flex-col rounded-2xl bg-pine p-5 text-white no-underline shadow-lg"
                        : "flex h-full flex-col rounded-2xl bg-white p-5 text-ink no-underline shadow-md"
                    }
                  >
                    <span
                      className={
                        featured
                          ? "grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white"
                          : "grid h-10 w-10 place-items-center rounded-full bg-[#fde7f0] text-pine"
                      }
                    >
                      <AxisMark index={index} />
                    </span>
                    <h3 className={`mt-3 min-h-12 text-base ${featured ? "text-white" : "text-ink"}`}>{axis.name}</h3>
                    <p className={`mt-2 flex-1 text-sm leading-6 ${featured ? "text-white" : "text-[#3f3f3f]"}`}>
                      {axis.description}
                    </p>
                    <span className={`mt-3 text-sm font-semibold ${featured ? "text-white" : "text-pine"}`}>
                      Saiba mais &gt;
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
