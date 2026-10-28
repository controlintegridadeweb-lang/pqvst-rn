import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { LIKERT_SCALES, SCALE_LABELS, getOfficialQuestionnaire, type LikertScale } from "@/domain/surveys/questionnaire";
import { ImportValidator } from "@/app/gestao/questionarios/import-validator";
import { Mark } from "@/app/gestao/desk-ui";

export const metadata = { title: "Questionários" };

const card = "rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]";

const SCALE_TITLE: Record<LikertScale, string> = {
  satisfaction: "Satisfação",
  frequency: "Frequência",
  agreement: "Concordância",
};

const SCALE_BAR: Record<LikertScale, string> = {
  satisfaction: "bg-[#c2185b]",
  frequency: "bg-[#6d5efc]",
  agreement: "bg-[#d4a017]",
};

export default function QuestionnairesPage() {
  const official = getOfficialQuestionnaire();
  const questions = official?.questions ?? [];
  const scoreable = questions.filter((question) => question.scoring === "scoreable_positive").length;

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8">
      <header className="mb-7 flex max-w-3xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Questionários</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Formulário oficial</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a7b90]">
            O arquivo precisa declarar origem oficial, fonte e a escala de cada item. Pergunta fora das três escalas não entra no IQVST.
          </p>
        </div>
        {official ? (
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#5c5b73] shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
            {official.versionLabel}
          </span>
        ) : null}
      </header>

      <section aria-label="Indicadores do formulário" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Itens oficiais" value={questions.length} icon="list" />
        <Metric label="Pontuáveis" value={scoreable} icon="check" />
        <Metric label="Eixos" value={OFFICIAL_AXES.length} icon="building" />
        <Metric label="Escalas" value={LIKERT_SCALES.length} icon="plan" tone="accent" />
      </section>

      <section className="mt-5" aria-label="Escalas oficiais">
        <ul className="grid gap-4 lg:grid-cols-3">
          {LIKERT_SCALES.map((scale) => (
            <li key={scale}>
              <ScaleCard scale={scale} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${card} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <SectionTitle kicker="Arquivo" title="Validar importação" />
          <p className="mt-2 text-sm leading-6 text-[#7a7b90]">A leitura acontece neste navegador. Nada é publicado como questionário oficial.</p>
          <div className="mt-5">
            <ImportValidator />
          </div>
        </section>

        <section className={`${card} px-5 py-5 xl:sticky xl:top-4 xl:col-span-2`}>
          <SectionTitle kicker="Metodologia" title="Eixos oficiais" />
          <ul className="mt-5 grid gap-2">
            {OFFICIAL_AXES.map((axis, index) => {
              const count = questions.filter((question) => question.axisCode === axis.code).length;
              return (
                <li key={axis.code} className="flex items-center gap-3 rounded-2xl bg-[#f7f6fd] px-3 py-2.5">
                  <Mark label={axis.code} index={index} />
                  <span className="min-w-0 flex-1 text-sm leading-5 font-semibold text-[#2c2a4a]">{axis.name}</span>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#6d5efc] tabular-nums">
                    {count.toLocaleString("pt-BR")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ScaleCard({ scale }: { scale: LikertScale }) {
  const labels = SCALE_LABELS[scale];
  const low = labels[0];
  const high = labels[labels.length - 1];
  return (
    <article className={`${card} flex h-full flex-col p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#2c2a4a]">{SCALE_TITLE[scale]}</h2>
        <span className="rounded-full bg-[#efeaff] px-2.5 py-1 text-[11px] font-medium text-[#6d5efc]">1 a 5</span>
      </div>
      <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
        {labels.map((item) => (
          <span
            key={item.value}
            className={`h-1.5 flex-1 rounded-full ${SCALE_BAR[scale]}`}
            style={{ opacity: 0.28 + item.value * 0.14 }}
          />
        ))}
      </div>
      <p className="mt-3 flex items-start justify-between gap-4 text-[11px] leading-4 text-[#8b8ca3]">
        <span>{low?.label}</span>
        <span className="text-right">{high?.label}</span>
      </p>
    </article>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8b8ca3] uppercase">{kicker}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-[#2c2a4a]">{title}</h2>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone = "plain",
}: {
  label: string;
  value: number;
  icon: "list" | "check" | "building" | "plan";
  tone?: "plain" | "accent";
}) {
  const accent = tone === "accent";
  return (
    <article
      className={
        accent
          ? "flex min-h-28 items-center justify-between rounded-[1.6rem] bg-[#6d5efc] px-5 py-5 text-white shadow-[0_10px_24px_rgba(109,94,252,0.22)]"
          : `${card} flex min-h-28 items-center justify-between px-5 py-5`
      }
    >
      <span>
        <span className={`block text-3xl font-semibold tracking-tight tabular-nums ${accent ? "text-white" : "text-[#2c2a4a]"}`}>
          {value.toLocaleString("pt-BR")}
        </span>
        <span className={`mt-1 block text-sm ${accent ? "text-white/85" : "text-[#7a7b90]"}`}>{label}</span>
      </span>
      <span className={`grid size-11 place-items-center rounded-2xl ${accent ? "bg-white/15 text-white" : "bg-[#efeaff] text-[#6d5efc]"}`}>
        <MetricIcon name={icon} />
      </span>
    </article>
  );
}

function MetricIcon({ name }: { name: "list" | "check" | "building" | "plan" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {name === "list" ? <path d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01" strokeLinecap="round" /> : null}
      {name === "check" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {name === "building" ? (
        <>
          <path d="M4 20h16M6 20V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V20" />
          <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01" strokeLinecap="round" />
        </>
      ) : null}
      {name === "plan" ? (
        <>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
          <path d="M9 9h6M9 13h4" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}
