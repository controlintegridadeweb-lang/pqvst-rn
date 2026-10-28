import Link from "next/link";
import { CycleStatus, participationLabel } from "@/app/gestao/desk-ui";
import type { ParticipationDesk } from "@/infrastructure/participation/collection";

const card = "rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]";
const seeAll = "shrink-0 text-sm font-semibold text-[#6d5efc] no-underline";

export function HomeDashboard({
  desk,
  notice,
}: {
  desk: ParticipationDesk | null;
  notice: string | null;
}) {
  const organizations = desk?.organizations ?? [];
  const cycles = desk?.cycles ?? [];
  const credentials = desk ? desk.balances.reduce((sum, balance) => sum + balance.total, 0) : null;
  const responses = desk ? desk.balances.reduce((sum, balance) => sum + balance.consumed, 0) : null;

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8">
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Gestão</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Visão da instalação</h1>
        {notice ? <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p> : null}
      </header>

      <section aria-label="Indicadores da gestão" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric href="/gestao/orgaos" label="Órgãos" value={desk ? organizations.length : null} icon="building" />
        <Metric href="/gestao/ciclos" label="Ciclos" value={desk ? cycles.length : null} icon="cycle" />
        <Metric href="/gestao/credenciais" label="Credenciais" value={credentials} icon="key" />
        <Metric href="/gestao/credenciais" label="Respostas" value={responses} icon="check" tone="accent" />
      </section>

      <div className="mt-6 grid items-stretch gap-5 xl:grid-cols-5">
        <section className={`${card} flex flex-col px-5 py-5 sm:px-6 xl:col-span-3`}>
          <div className="flex items-end justify-between gap-4">
            <SectionTitle kicker="Coleta" title="Ciclos recentes" />
            <Link href="/gestao/ciclos" className={seeAll}>
              Ver todos
            </Link>
          </div>
          {cycles.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Ciclo</th>
                    <th className="pb-3 font-medium">Participação</th>
                    <th className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.slice(0, 8).map((cycle) => (
                    <tr key={cycle.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4 font-medium text-[#2c2a4a]">
                        <Link href="/gestao/ciclos" className="text-[#2c2a4a] no-underline">
                          {cycle.name}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 text-[#7a7b90]">{participationLabel(cycle.organizationIds.length)}</td>
                      <td className="py-4">
                        <CycleStatus status={cycle.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 flex flex-1 items-center rounded-2xl bg-[#f7f6fd] px-5 py-8 text-sm leading-6 text-[#7a7b90]">
              {desk ? "Nenhum ciclo foi aberto nesta instalação." : "Os ciclos aparecem depois da entrada institucional."}
            </p>
          )}
        </section>

        <section className={`${card} flex flex-col px-5 py-5 xl:col-span-2`}>
          <div className="flex items-end justify-between gap-4">
            <SectionTitle kicker="Cadastro" title="Órgãos" />
            <Link href="/gestao/orgaos" className={seeAll}>
              Ver todos
            </Link>
          </div>
          {organizations.length > 0 ? (
            <ul className="mt-5 grid gap-2.5">
              {organizations.slice(0, 6).map((organization) => (
                <li key={organization.id}>
                  <Link href="/gestao/orgaos" className="flex items-start gap-3 rounded-2xl bg-[#f7f6fd] px-3.5 py-3 no-underline">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#6d5efc]">
                      <FolderIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5 font-semibold text-[#2c2a4a]">{organization.name}</span>
                      <span className="mt-0.5 block text-xs tracking-wide text-[#8b8ca3]">{organization.acronym}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 flex flex-1 items-center rounded-2xl bg-[#f7f6fd] px-5 py-8 text-sm leading-6 text-[#7a7b90]">
              {desk ? "Nenhum órgão foi cadastrado nesta instalação." : "Os órgãos aparecem depois da entrada institucional."}
            </p>
          )}
        </section>
      </div>
    </div>
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
  href,
  label,
  value,
  icon,
  tone = "plain",
}: {
  href: string;
  label: string;
  value: number | null;
  icon: "building" | "cycle" | "key" | "check";
  tone?: "plain" | "accent";
}) {
  const accent = tone === "accent";
  return (
    <Link
      href={href}
      className={
        accent
          ? "flex min-h-28 items-center justify-between rounded-[1.6rem] bg-[#6d5efc] px-5 py-5 text-white no-underline shadow-[0_10px_24px_rgba(109,94,252,0.22)]"
          : `${card} flex min-h-28 items-center justify-between px-5 py-5 text-[#2c2a4a] no-underline`
      }
    >
      <span>
        <span className={`block text-3xl font-semibold tracking-tight tabular-nums ${accent ? "text-white" : "text-[#2c2a4a]"}`}>
          {value === null ? "–" : value.toLocaleString("pt-BR")}
        </span>
        <span className={`mt-1 block text-sm ${accent ? "text-white/85" : "text-[#7a7b90]"}`}>{label}</span>
      </span>
      <span className={`grid size-11 place-items-center rounded-2xl ${accent ? "bg-white/15 text-white" : "bg-[#efeaff] text-[#6d5efc]"}`}>
        <MetricIcon name={icon} />
      </span>
    </Link>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2a2 2 0 0 1 1.5.7l1.1 1.3H18A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    </svg>
  );
}

function MetricIcon({ name }: { name: "building" | "cycle" | "key" | "check" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {name === "building" ? (
        <>
          <path d="M4 20h16M6 20V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V20" />
          <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01" strokeLinecap="round" />
        </>
      ) : null}
      {name === "cycle" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2" strokeLinecap="round" />
        </>
      ) : null}
      {name === "key" ? (
        <>
          <circle cx="8" cy="14" r="4" />
          <path d="M11.5 12.5 20 4m0 0h-3.5M20 4v3.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {name === "check" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  );
}
