import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { OFFICIAL_BANDS } from "@/domain/indicators/classification";

export const metadata = { title: "Metodologia" };

const GAUGE = { cx: 400, cy: 320, outer: 260, inner: 160 };

const BAND_FILL: Record<(typeof OFFICIAL_BANDS)[number]["code"], string> = {
  muito_baixa: "#b91c1c",
  baixa: "#ea580c",
  necessidade_acoes_prioritarias: "#ca8a04",
  boa: "#2563eb",
  excelente: "#15803d",
};

function gaugePoint(radius: number, value: number) {
  const angle = Math.PI * (1 - (value - 1) / 4);
  return {
    x: GAUGE.cx + radius * Math.cos(angle),
    y: GAUGE.cy - radius * Math.sin(angle),
  };
}

function gaugeSegment(start: number, end: number) {
  const outerStart = gaugePoint(GAUGE.outer, start);
  const outerEnd = gaugePoint(GAUGE.outer, end);
  const innerEnd = gaugePoint(GAUGE.inner, end);
  const innerStart = gaugePoint(GAUGE.inner, start);
  return `M ${outerStart.x} ${outerStart.y} A ${GAUGE.outer} ${GAUGE.outer} 0 0 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${GAUGE.inner} ${GAUGE.inner} 0 0 0 ${innerStart.x} ${innerStart.y} Z`;
}

const GAUGE_BANDS = [
  { code: "muito_baixa" as const, start: 1, end: 1.5 },
  { code: "baixa" as const, start: 1.5, end: 2.5 },
  { code: "necessidade_acoes_prioritarias" as const, start: 2.5, end: 3.5 },
  { code: "boa" as const, start: 3.5, end: 4.5 },
  { code: "excelente" as const, start: 4.5, end: 5 },
];

function Gauge() {
  const needle = gaugePoint(GAUGE.outer - 28, 3.77);
  return (
    <svg viewBox="0 0 800 360" className="w-full" role="img" aria-label="Medidor das faixas oficiais do IQVST, de 1,0 a 5,0.">
      {GAUGE_BANDS.map((band) => (
        <path key={band.code} d={gaugeSegment(band.start, band.end)} fill={BAND_FILL[band.code]} stroke="#f3f4f6" strokeWidth="4" />
      ))}
      <line x1={GAUGE.cx} y1={GAUGE.cy} x2={needle.x} y2={needle.y} stroke="#171717" strokeWidth="5" strokeLinecap="round" />
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r="16" fill="#f3f4f6" />
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r="7" fill="#171717" />
    </svg>
  );
}

function BandNote({ code, align = "left" }: { code: (typeof GAUGE_BANDS)[number]["code"]; align?: "left" | "right" | "center" }) {
  const band = OFFICIAL_BANDS.find((item) => item.code === code);
  if (!band) return null;
  return (
    <div className={align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}>
      <p className="text-base font-semibold" style={{ color: BAND_FILL[code] }}>
        {band.label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#5c5c5c]">{band.officialRangeLabel}</p>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <>
      <section className="grid overflow-hidden bg-white lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-pine px-5 py-12 text-white sm:py-14 lg:rounded-r-[4.5rem] lg:py-16 lg:pr-12 lg:pl-[max(1.25rem,calc((100vw-72rem)/2+2.5rem))]">
          <p className="text-sm font-semibold tracking-wide uppercase">IQVST</p>
          <h1 className="mt-4 max-w-xl text-3xl leading-tight sm:text-4xl">
            A média dos eixos, não a média solta das perguntas.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/90">
            Primeiro se calcula a média das perguntas pontuáveis de cada eixo. O IQVST é a média aritmética dessas seis
            médias. Todos os eixos têm o mesmo peso.
          </p>
        </div>
        <div className="flex items-center bg-white px-5 py-12 text-pine-deep sm:py-14 lg:py-16 lg:pr-[max(1.25rem,calc((100vw-72rem)/2+2.5rem))] lg:pl-14">
          <div className="grid w-full max-w-xl gap-8">
            <div>
              <h2 className="text-2xl">Fórmula</h2>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-xl font-semibold">IQVST =</span>
                <span className="inline-flex w-[15.5rem] flex-col items-center text-center sm:w-[20rem]">
                  <span className="px-3 pb-1.5 text-base leading-6">
                    Eixo 1 + Eixo 2 + Eixo 3 + Eixo 4 + Eixo 5 + Eixo 6
                  </span>
                  <span className="h-0.5 w-full bg-pine-deep" />
                  <span className="pt-1.5 text-xl font-semibold">6</span>
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-lg">Exemplo do guia</h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="inline-flex w-fit flex-col items-center text-center">
                  <span className="px-3 pb-1 text-base leading-6">4,2 + 3,8 + 3,5 + 4,0 + 3,2 + 3,9</span>
                  <span className="h-0.5 w-full bg-pine-deep" />
                  <span className="pt-1 font-semibold">6</span>
                </span>
                <p className="text-base leading-7">
                  <span className="font-semibold">≈ 3,77</span>
                  <span className="text-[#7a3050]"> · classificação Boa</span>
                </p>
              </div>
            </div>
            <p className="max-w-md border-t border-[#f3d0de] pt-5 text-sm leading-6 text-[#7a3050]">
              Pergunta sem resposta não entra como zero. Eixo sem dado impede o cálculo do indicador.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y-4 border-[#d12d6c] bg-[#f3f4f6]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid items-end gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <h2 className="text-3xl text-ink">Classificação descrita no guia</h2>
            <p className="text-sm leading-6 text-[#5c5c5c] lg:text-right">
              As faixas vão de 1,0 a 5,0. O ponteiro marca o exemplo do guia, 3,77, na faixa Boa. Não é um resultado
              publicado.
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-3xl">
            <Gauge />
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GAUGE_BANDS.map((band) => (
              <li key={band.code} className="border-t-4 pt-3" style={{ borderColor: BAND_FILL[band.code] }}>
                <BandNote code={band.code} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f48fb1]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-center text-3xl text-pine-deep">Os seis eixos oficiais</h2>
          <ol className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {OFFICIAL_AXES.map((axis, index) => {
              const featured = index % 3 === 1;
              return (
                <li key={axis.code}>
                  <article
                    className={
                      featured
                        ? "flex h-full flex-col rounded-2xl bg-pine p-5 text-white shadow-lg"
                        : "flex h-full flex-col rounded-2xl bg-white p-5 text-ink shadow-md"
                    }
                  >
                    <span
                      className={
                        featured
                          ? "grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-semibold text-white"
                          : "grid h-10 w-10 place-items-center rounded-full bg-[#fde7f0] text-sm font-semibold text-pine"
                      }
                    >
                      {axis.code}
                    </span>
                    <h3 className={`mt-3 text-base ${featured ? "text-white" : "text-ink"}`}>{axis.name}</h3>
                    <p className={`mt-2 text-sm leading-6 ${featured ? "text-white" : "text-[#3f3f3f]"}`}>
                      {axis.description}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
