import type { ReactNode } from "react";
import Link from "next/link";
import { OFFICIAL_BANDS } from "@/domain/indicators/classification";
import { type DashboardAxis, type DashboardModel } from "@/domain/dashboards/view-model";
import { AxisComparisonChart, HistoryChart } from "@/components/charts";

const BAND_FILL: Record<(typeof OFFICIAL_BANDS)[number]["code"], string> = {
  excelente: "#16a34a",
  boa: "#3b82f6",
  necessidade_acoes_prioritarias: "#eab308",
  baixa: "#f97316",
  muito_baixa: "#e11d48",
};

const BAND_SPAN: Record<(typeof OFFICIAL_BANDS)[number]["code"], number> = {
  muito_baixa: 12.5,
  baixa: 25,
  necessidade_acoes_prioritarias: 25,
  boa: 25,
  excelente: 12.5,
};

function figure(value: number | null) {
  return value === null ? "–" : value.toLocaleString("pt-BR");
}

function axisStatus(axis: DashboardAxis) {
  if (axis.status === "published") return "Publicada";
  if (axis.status === "suppressed") return "Reservado";
  if (axis.status === "not_computable") return "Não calculável";
  return "Sem publicação";
}

function axisMean(axis: DashboardAxis) {
  if (axis.status !== "published" || axis.mean === null) return "–";
  return axis.meanLabel ?? axis.mean.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] ${className}`}>
      <h2 className="text-base font-semibold text-[#241820]">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-[#7d6a73]">{subtitle}</p>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function IqvstGauge({ label, classification }: { label: string | null; classification: string | null }) {
  const size = 176;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const center = size / 2;

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div
        className="relative"
        role="img"
        aria-label={
          label
            ? `IQVST estadual ${label}${classification ? `, classificação ${classification}` : ""}.`
            : "IQVST estadual sem resultado publicado. Escala oficial de 1,0 a 5,0."
        }
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={center} cy={center} r={radius - 18} fill="#fff7fa" />
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#f6d5e3" strokeWidth={stroke} />
        </svg>
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          {label ? (
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[#241820] tabular-nums">{label}</p>
              <p className="mt-1 text-[11px] font-medium tracking-[0.14em] text-[#a41f52] uppercase">IQVST</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-[#a41f52]">Sem resultado</p>
              <p className="mt-1 text-xs text-[#8a7380]">Escala de 1 a 5</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#fbf7f8] px-3 py-3">
          <p className="text-xs text-[#8a7380]">Classificação</p>
          <p className="mt-1 text-sm font-semibold text-[#241820]">{classification ?? "Aguardando"}</p>
        </div>
        <div className="rounded-xl bg-[#fbf7f8] px-3 py-3">
          <p className="text-xs text-[#8a7380]">Escala oficial</p>
          <p className="mt-1 text-sm font-semibold text-[#241820]">1,0 – 5,0</p>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ model }: { model: DashboardModel }) {
  const indicators = [
    { label: "Órgãos participantes", value: figure(model.participatingOrganizations), empty: model.participatingOrganizations === null, hint: "Conjunto estadual" },
    { label: "Órgãos publicados", value: figure(model.publishedOrganizations), empty: model.publishedOrganizations === null, hint: "Resultado autorizado" },
    { label: "Respostas válidas", value: figure(model.responseCount), empty: model.responseCount === null, hint: "Somente agregados" },
    { label: "IQVST estadual", value: model.iqvstLabel ?? "–", empty: model.iqvstLabel === null, hint: model.classificationLabel ?? "Média dos seis eixos" },
    { label: "Participação", value: model.participationLabel ?? "–", empty: model.participationLabel === null, hint: "Servidores elegíveis" },
  ];
  const bars = model.axes.map((axis) => ({
    code: axis.code,
    name: axis.name,
    mean: axis.status === "published" ? axis.mean : null,
  }));
  const scaleOrder = [...OFFICIAL_BANDS].reverse();
  const notes = [
    ...model.notices,
    "A taxa de participação entra com quantitativo confiável de servidores elegíveis.",
    "O recorte por setor fica de fora para proteger a identificação.",
    "Os indicadores públicos saem de agregados verificados. Esta tela não consulta respostas individuais.",
  ];

  return (
    <div className="overflow-x-hidden bg-[#fbf7f8] pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-5">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-sm font-medium text-[#d12d6c]">Painel público</p>
            <h1 className="mt-1 max-w-full text-2xl leading-tight font-semibold tracking-tight text-[#241820] md:text-3xl">{model.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p aria-live="polite" className="rounded-full bg-white px-3 py-1.5 text-xs text-[#7d6a73] ring-1 ring-[#f3e4ea]">
              {model.updatedAt ? `Atualizado em ${model.updatedAt}` : "Aguardando publicação"}
            </p>
            <nav aria-label="Recortes do painel" className="flex items-center gap-1.5">
              <span className="rounded-full bg-[#d12d6c] px-3 py-1.5 text-xs font-medium text-white">Estadual</span>
              <Link
                href="/transparencia/orgaos"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241820] no-underline ring-1 ring-[#f3e4ea] hover:text-[#d12d6c]"
              >
                Órgãos
              </Link>
            </nav>
          </div>
        </header>

        <section aria-label="Indicadores estaduais" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {indicators.map((item) => (
            <article
              key={item.label}
              aria-label={item.empty ? `${item.label}: não disponível` : `${item.label}: ${item.value}`}
              className="min-w-0 rounded-2xl bg-white px-3 py-4 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] sm:px-4"
            >
              <h2 className="text-sm leading-5 text-[#7d6a73]">{item.label}</h2>
              <p
                className={`mt-3 tracking-tight tabular-nums ${item.empty ? "text-lg font-medium text-[#c9a3b2]" : "text-3xl leading-none font-semibold text-[#241820]"}`}
                aria-hidden="true"
              >
                {item.empty ? "Aguardando" : item.value}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#8a7380]">{item.hint}</p>
            </article>
          ))}
        </section>

        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
          <Panel title="IQVST estadual" subtitle="Média dos seis eixos, todos com o mesmo peso.">
            <IqvstGauge label={model.iqvstLabel} classification={model.classificationLabel} />
          </Panel>

          <Panel title="Seis eixos" subtitle="Cada barra mostra a média autorizada, de 1 a 5.">
            <AxisComparisonChart axes={bars} />
          </Panel>

          <Panel title="Faixas oficiais" subtitle="A escala do guia, da menor percepção à maior.">
            <div className="flex h-3 gap-1" role="img" aria-label="Faixas oficiais de 1,0 a 5,0, ainda sem marca de resultado.">
              {scaleOrder.map((band) => (
                <div
                  key={band.code}
                  className="h-full rounded-full"
                  style={{ flexGrow: BAND_SPAN[band.code], backgroundColor: BAND_FILL[band.code] }}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {scaleOrder.map((band) => (
                <li key={band.code} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: BAND_FILL[band.code] }}
                    />
                    <span className="leading-5 text-[#3f2c34]">{band.label}</span>
                  </span>
                  <span className="shrink-0 text-[#8a7380] tabular-nums">{band.officialRangeLabel}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="mt-4 grid w-full min-w-0 items-stretch gap-4 lg:grid-cols-12">
          <Panel className="lg:col-span-5" title="Evolução do IQVST" subtitle="Somente ciclos da mesma metodologia.">
            <HistoryChart points={model.history} />
          </Panel>

          <Panel className="lg:col-span-7" title="Leitura dos eixos" subtitle="O que já pode ser publicado em cada eixo.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[#8a7380]">
                    <th scope="col" className="pb-3 pr-3 font-medium">
                      Eixo
                    </th>
                    <th scope="col" className="pb-3 pr-3 font-medium">
                      Média
                    </th>
                    <th scope="col" className="pb-3 font-medium">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {model.axes.map((axis) => {
                    const published = axis.status === "published";
                    return (
                      <tr key={axis.code} className="border-t border-[#f6eef2]">
                        <th scope="row" className="py-3 pr-3 font-medium text-[#241820]">
                          <span className="flex items-start gap-2.5">
                            <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-[#fde7f0] px-1.5 py-0.5 text-[11px] font-semibold text-[#a41f52]">
                              {axis.code}
                            </span>
                            <span className="leading-5">{axis.name}</span>
                          </span>
                        </th>
                        <td className={`py-3 pr-3 text-base tabular-nums ${published ? "font-semibold text-[#241820]" : "text-[#c9a3b2]"}`}>
                          {published ? axisMean(axis) : "–"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs ${published ? "bg-[#fde7f0] text-[#a41f52]" : "bg-[#f6f1f3] text-[#6d5a63]"}`}
                          >
                            {axisStatus(axis)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="mt-4 rounded-2xl bg-white px-5 py-4 shadow-[0_10px_30px_rgba(120,30,60,0.04)] ring-1 ring-[#f3e4ea]">
          <h2 className="text-sm font-semibold text-[#241820]">Como ler este painel</h2>
          <ul className="mt-3 space-y-2.5">
            {notes.map((notice) => (
              <li key={notice} className="flex gap-3 text-sm leading-6 text-[#6d5a63]">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b3c8]" />
                <span>{notice}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

