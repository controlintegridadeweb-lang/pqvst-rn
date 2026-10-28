import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import {
  LIKERT_SCALES,
  SCALE_LABELS,
  getOfficialQuestionnaire,
  type ImportedQuestion,
  type LikertScale,
} from "@/domain/surveys/questionnaire";
import { ImportValidator } from "@/app/gestao/questionarios/import-validator";
import { ShellMetric, ShellPage, ShellTitle, shellButton, shellCard } from "@/app/gestao/desk-ui";

export const metadata = { title: "Questionários" };

const SCALE_TITLE: Record<LikertScale, string> = {
  satisfaction: "Satisfação",
  frequency: "Frequência",
  agreement: "Concordância",
};

const SCALE_BOX: Record<LikertScale, string> = {
  satisfaction: "bg-[#c2185b]",
  frequency: "bg-[#6d5efc]",
  agreement: "bg-[#d4a017]",
};

export default function QuestionnairesPage() {
  const official = getOfficialQuestionnaire();
  const questions = official?.questions ?? [];
  const scoreable = questions.filter((question) => question.scoring === "scoreable_positive").length;
  const axesPhrase = OFFICIAL_AXES.length === 6 ? "seis eixos" : `${OFFICIAL_AXES.length} eixos`;

  return (
    <ShellPage
      kicker="Questionários"
      title="Conheça o questionário"
      notice={`O questionário possui ${questions.length.toLocaleString("pt-BR")} itens distribuídos em ${axesPhrase} de avaliação. Desse total, ${scoreable.toLocaleString("pt-BR")} são considerados no cálculo do IQVST.`}
    >
      <section aria-label="Indicadores do formulário" className="grid gap-4 sm:grid-cols-3">
        <ShellMetric label="Itens" value={questions.length} icon="list" />
        <ShellMetric label="Eixos" value={OFFICIAL_AXES.length} icon="building" />
        <ShellMetric label="Pontuáveis" value={scoreable} icon="check" tone="accent" />
      </section>

      <section className="mt-8" aria-label="Como funcionam as respostas">
        <ShellTitle kicker="Respostas" title="Como funcionam as respostas?" />
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a7b90]">
          As perguntas utilizam três tipos de escala, com opções de 1 a 5.
        </p>
        <ul className="mt-4 grid gap-4 lg:grid-cols-3">
          {LIKERT_SCALES.map((scale) => (
            <li key={scale}>
              <ScaleCard scale={scale} />
            </li>
          ))}
        </ul>
        <a href="#questionario-completo" className={`${shellButton} mt-5`}>
          Ver questionário completo
        </a>
      </section>

      <div id="questionario-completo" className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${shellCard} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <ShellTitle kicker="Formulário" title="Questionário completo" />
          {official ? (
            <p className="mt-2 text-sm text-[#7a7b90]">{official.versionLabel}</p>
          ) : (
            <p className="mt-2 text-sm text-[#7a7b90]">O formulário oficial ainda não está disponível para leitura.</p>
          )}
          <div className="mt-5 grid gap-6">
            {groupBySection(questions).map((group) => (
              <section key={group.name}>
                <h3 className="text-sm font-semibold text-[#2c2a4a]">{group.name}</h3>
                <ol className="mt-2 grid gap-2">
                  {group.questions.map((question) => (
                    <li key={question.code} className="rounded-2xl bg-[#f7f6fd] px-4 py-3">
                      <p className="text-sm leading-6 text-[#2c2a4a]">{question.prompt}</p>
                      <p className="mt-1 text-xs text-[#8b8ca3]">
                        {question.code}
                        {question.axisCode ? ` · ${question.axisCode}` : ""}
                        {" · "}
                        {question.scoring === "scoreable_positive" ? "Entra no IQVST" : "Não entra no IQVST"}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>

        <section className={`${shellCard} px-5 py-5 sm:px-6 xl:sticky xl:top-4 xl:col-span-2`}>
          <ShellTitle kicker="Arquivo" title="Validar importação" />
          <p className="mt-2 text-sm leading-6 text-[#7a7b90]">
            A leitura acontece neste navegador. Nada é publicado como questionário oficial.
          </p>
          <div className="mt-5">
            <ImportValidator />
          </div>
        </section>
      </div>
    </ShellPage>
  );
}

function ScaleCard({ scale }: { scale: LikertScale }) {
  const labels = SCALE_LABELS[scale];
  const low = labels[0]?.label ?? "";
  const high = labels[labels.length - 1]?.label ?? "";
  return (
    <article className={`${shellCard} flex h-full flex-col p-5`}>
      <h2 className="text-sm font-semibold text-[#2c2a4a]">{SCALE_TITLE[scale]}</h2>
      <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-label={`${SCALE_TITLE[scale]}, de ${low} a ${high}`}>
        {labels.map((item) => (
          <li
            key={item.value}
            className={`grid h-11 place-items-center rounded-xl text-sm font-semibold text-white ${SCALE_BOX[scale]}`}
          >
            {item.value}
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-start justify-between gap-3 text-[11px] leading-4 text-[#8b8ca3]">
        <span>{low}</span>
        <span className="text-right">{high}</span>
      </p>
    </article>
  );
}

function groupBySection(questions: readonly ImportedQuestion[]) {
  const groups: { name: string; questions: ImportedQuestion[] }[] = [];
  for (const question of questions) {
    const name = question.section ?? "Sem seção";
    const current = groups[groups.length - 1];
    if (current && current.name === name) current.questions.push(question);
    else groups.push({ name, questions: [question] });
  }
  return groups;
}
