import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { CreateOrganizationForm } from "@/app/gestao/orgaos/create-organization-form";
import type { DeskCycle, DeskOrganization } from "@/infrastructure/participation/collection";

export const metadata = { title: "Órgãos" };

const purpleButton =
  "on-pink w-full rounded-full bg-[#6d5efc] px-5 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-[0_8px_18px_rgba(109,94,252,0.28)] disabled:opacity-60";

export default function OrganizationsAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8]" />}>
      <Organizations />
    </Suspense>
  );
}

async function Organizations() {
  const access = await readDeskAccess();
  if (access.status !== "ready") {
    return (
      <Canvas notice={blockedNotice(access)}>
        <div />
        <aside className="grid gap-4">
          <Summary orgs={null} inCycle={null} outOfCycle={null} />
        </aside>
      </Canvas>
    );
  }

  const { canManage, desk } = access;
  const inCycleIds = new Set(
    desk.organizations
      .filter((organization) => desk.cycles.some((cycle) => cycle.organizationIds.includes(organization.id)))
      .map((organization) => organization.id),
  );
  const cycles = desk.cycles.filter((cycle) => cycle.organizationIds.length > 0);

  return (
    <Canvas notice="O cadastro guarda nome, sigla e situação no programa. O gestor local só enxerga o órgão do seu vínculo.">
      <div className="grid gap-8">
        <section>
          <SectionTitle kicker="Em destaque" title="No programa" />
          {desk.organizations.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {desk.organizations.slice(0, 3).map((organization) => (
                <li key={organization.id}>
                  <FolderCard organization={organization} inCycle={inCycleIds.has(organization.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-[1.6rem] bg-white px-5 py-8 text-sm leading-6 text-[#7a7b90] shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
              Não há órgão gravado. Nenhum exemplo foi inventado.
            </p>
          )}
        </section>

        <section className="rounded-[1.6rem] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(70,60,120,0.05)] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle kicker="Lista" title="Cadastro" />
            <span className="rounded-full bg-[#efeaff] px-3 py-1 text-xs font-medium text-[#6d5efc]">
              {desk.organizations.length.toLocaleString("pt-BR")}
            </span>
          </div>
          {desk.organizations.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Órgão</th>
                    <th className="pb-3 font-medium">Sigla</th>
                    <th className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {desk.organizations.map((organization) => (
                    <tr key={organization.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4">
                        <span className="flex items-center gap-3">
                          <FolderMark />
                          <span className="font-medium text-[#2c2a4a]">{organization.name}</span>
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="rounded-lg bg-[#f7f6fd] px-2 py-1 text-xs font-medium tracking-wide text-[#5c5b73]">
                          {organization.acronym}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex rounded-full bg-[#efeaff] px-2.5 py-1 text-xs font-medium text-[#5b4fd6]">
                          {inCycleIds.has(organization.id) ? "Em ciclo" : "Ativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[#6b6b80]">Não há órgão gravado. Nenhum exemplo foi inventado.</p>
          )}
        </section>

        <section>
          <SectionTitle kicker="Participação" title="Ciclos com órgão" />
          {cycles.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cycles.map((cycle) => (
                <li key={cycle.id}>
                  <CycleCard cycle={cycle} organizations={desk.organizations} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-[1.6rem] bg-white px-5 py-8 text-sm leading-6 text-[#7a7b90] shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
              Nenhum ciclo tem órgão participante.
            </p>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4 xl:sticky xl:top-4">
        <Summary
          orgs={desk.organizations.length}
          inCycle={inCycleIds.size}
          outOfCycle={desk.organizations.length - inCycleIds.size}
        />
        <section className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
          <div className="bg-gradient-to-br from-[#efeaff] via-[#f8f6ff] to-[#fff5f8] px-5 pt-5 pb-4">
            <InviteArt />
            <p className="mt-1 text-center text-sm font-medium text-[#3d3a5c]">Inclua o órgão para ele entrar em um ciclo.</p>
          </div>
          <div className="p-5">
            {canManage ? (
              <CreateOrganizationForm buttonClassName={purpleButton} />
            ) : (
              <p className="text-sm leading-6 text-[#7a7b90]">O cadastro de órgãos fica com a administração estadual.</p>
            )}
            <Link href="/gestao/ciclos" className="mt-3 block text-center text-sm font-semibold text-[#6d5efc] no-underline">
              Ir para ciclos
            </Link>
          </div>
        </section>
      </aside>
    </Canvas>
  );
}

function Canvas({ notice, children }: { notice: string; children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8">
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Órgãos</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Cadastro do programa</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">{children}</div>
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

function FolderCard({ organization, inCycle }: { organization: DeskOrganization; inCycle: boolean }) {
  return (
    <article className="flex min-h-48 flex-col rounded-[1.6rem] bg-white p-5 shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <FolderMark large />
        <span className="rounded-full bg-[#efeaff] px-2.5 py-1 text-[11px] font-medium text-[#6d5efc]">
          {inCycle ? "Em ciclo" : "Fora de ciclo"}
        </span>
      </div>
      <h3 className="mt-auto pt-6 text-[15px] leading-snug font-semibold text-[#2c2a4a]">{organization.name}</h3>
      <p className="mt-1 text-xs tracking-wide text-[#8b8ca3]">{organization.acronym}</p>
    </article>
  );
}

function CycleCard({ cycle, organizations }: { cycle: DeskCycle; organizations: readonly DeskOrganization[] }) {
  const names = cycle.organizationIds
    .map((id) => organizations.find((organization) => organization.id === id)?.acronym)
    .filter((acronym): acronym is string => Boolean(acronym));
  return (
    <article className="rounded-[1.4rem] bg-white p-4 shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
      <span className="grid size-11 place-items-center rounded-2xl bg-[#efeaff] text-[#6d5efc]">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2" strokeLinecap="round" />
        </svg>
      </span>
      <h3 className="mt-4 text-sm font-semibold text-[#2c2a4a]">{cycle.name}</h3>
      <p className="mt-1 text-xs text-[#8b8ca3]">{names.length > 0 ? names.join(", ") : "Sem órgão visível"}</p>
    </article>
  );
}

function Summary({
  orgs,
  inCycle,
  outOfCycle,
}: {
  orgs: number | null;
  inCycle: number | null;
  outOfCycle: number | null;
}) {
  const rows = [
    ["Órgãos", orgs],
    ["Em ciclo", inCycle],
    ["Fora de ciclo", outOfCycle],
  ] as const;
  return (
    <section className="rounded-[1.6rem] bg-white p-5 shadow-[0_8px_24px_rgba(70,60,120,0.05)]">
      <SectionTitle kicker="Números" title="Resumo" />
      <ul className="mt-4 grid gap-2.5">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f6fd] px-3.5 py-3">
            <span className="text-sm text-[#5c5b73]">{label}</span>
            <span className="text-xl font-semibold text-[#2c2a4a] tabular-nums">{value === null ? "–" : value.toLocaleString("pt-BR")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FolderMark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={
        large
          ? "grid size-14 place-items-center rounded-[1.25rem] bg-[#efeaff] text-[#6d5efc]"
          : "grid size-9 place-items-center rounded-xl bg-[#efeaff] text-[#6d5efc]"
      }
    >
      <svg viewBox="0 0 24 24" className={large ? "size-7" : "size-4"} fill="currentColor" aria-hidden="true">
        <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.2a2 2 0 0 1 1.5.7l1.1 1.3H18A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      </svg>
    </span>
  );
}

function InviteArt() {
  return (
    <svg viewBox="0 0 280 112" className="mx-auto h-24 w-full" role="img" aria-label="Ilustração de pastas e um órgão.">
      <circle cx="78" cy="58" r="34" fill="#e4dcff" />
      <circle cx="168" cy="46" r="26" fill="#ffd9e8" />
      <circle cx="214" cy="70" r="18" fill="#ffe3a3" />
      <path d="M58 48h28l6 8h42a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H58a10 10 0 0 1-10-10V58a10 10 0 0 1 10-10z" fill="#6d5efc" />
      <path d="M58 48h24l6 8H48" fill="#8d7dff" />
    </svg>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") {
    return "Enquanto a configuração do servidor estiver incompleta, nenhum órgão é exibido.";
  }
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. O cadastro de órgãos fica com a administração estadual.";
}
