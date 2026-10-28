"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePublicDashboard } from "@/app/transparencia/use-public-dashboard";
import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import type { DashboardCatalog } from "@/domain/dashboards/from-snapshots";
import type { DashboardModel } from "@/domain/dashboards/view-model";

const NOTES = [
  "Quando houver publicação, cada órgão aparecerá com o próprio IQVST, os seis eixos, a série comparável e as ações autorizadas.",
  "Não haverá ranking entre órgãos.",
  "A lista permanece vazia quando não existe agregado publicado. Isso não significa participação zero.",
];

export function OrganizationsLive({ initial }: { initial: DashboardCatalog }) {
  const catalog = usePublicDashboard(initial);
  const model: DashboardModel = catalog.editions[0]?.model ?? catalog.fallback;
  const published = model.availability === "published";
  const indicators = [
    { label: "IQVST", value: null, hint: "Média de cada órgão na lista" },
    { label: "Eixos", value: published ? String(OFFICIAL_AXES.length) : null, hint: "Seis eixos oficiais" },
    { label: "Ações autorizadas", value: null, hint: "Somente divulgação" },
  ];

  return (
    <div className="overflow-x-hidden bg-[#fbf7f8] pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-5">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-sm font-medium text-[#d12d6c]">Órgãos</p>
            <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-[#241820] md:text-3xl">
              {published ? model.title : "Nenhum painel institucional foi publicado."}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p aria-live="polite" className="rounded-full bg-white px-3 py-1.5 text-xs text-[#7d6a73] ring-1 ring-[#f3e4ea]">
              {model.updatedAt ? `Atualizado em ${model.updatedAt}` : "Aguardando publicação"}
            </p>
            <nav aria-label="Recortes do painel" className="flex items-center gap-1.5">
              <Link
                href="/transparencia"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#241820] no-underline ring-1 ring-[#f3e4ea] hover:text-[#d12d6c]"
              >
                Estadual
              </Link>
              <span className="rounded-full bg-[#d12d6c] px-3 py-1.5 text-xs font-medium text-white">Órgãos</span>
            </nav>
          </div>
        </header>

        <section aria-label="Indicadores dos órgãos" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {indicators.map((item) => (
            <article
              key={item.label}
              aria-label={item.value === null ? `${item.label}: não disponível` : `${item.label}: ${item.value}`}
              className="min-w-0 rounded-2xl bg-white px-3 py-4 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] sm:px-4"
            >
              <h2 className="text-sm leading-5 text-[#7d6a73]">{item.label}</h2>
              <p
                className={`mt-3 tracking-tight tabular-nums ${item.value === null ? "text-lg font-medium text-[#c9a3b2]" : "text-3xl leading-none font-semibold text-[#241820]"}`}
                aria-hidden="true"
              >
                {item.value ?? "Aguardando"}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#8a7380]">{item.hint}</p>
            </article>
          ))}
        </section>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Órgãos" subtitle="Cada resultado fica no próprio órgão, sem comparação depreciativa.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[#8a7380]">
                    <th scope="col" className="pb-3 pr-3 font-medium">Órgão</th>
                    <th scope="col" className="pb-3 pr-3 font-medium">IQVST</th>
                    <th scope="col" className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {model.organizations.length === 0 ? (
                    <tr className="border-t border-[#f6eef2]">
                      <td colSpan={3} className="py-4 text-sm leading-6 text-[#6d5a63]">
                        A lista permanece vazia porque não existe agregado publicado. Isso não significa participação zero.
                      </td>
                    </tr>
                  ) : (
                    model.organizations.map((organization) => (
                      <tr key={organization.id} className="border-t border-[#f6eef2]">
                        <th scope="row" className="py-3 pr-3 font-medium text-[#241820]">
                          {organization.name}
                        </th>
                        <td className="py-3 pr-3 text-base font-semibold text-[#241820] tabular-nums">
                          {organization.iqvstLabel ?? "–"}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-[#fde7f0] px-2.5 py-1 text-xs text-[#a41f52]">Publicada</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Como ler" subtitle="O que esta página mostra quando houver publicação.">
            <ul className="space-y-2.5">
              {NOTES.map((notice) => (
                <li key={notice} className="flex gap-3 text-sm leading-6 text-[#6d5a63]">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b3c8]" />
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] ${className}`}>
      <h2 className="text-base font-semibold text-[#241820]">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-[#7d6a73]">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
