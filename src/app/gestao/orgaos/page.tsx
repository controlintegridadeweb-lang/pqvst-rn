import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { CreateOrganizationForm } from "@/app/gestao/orgaos/create-organization-form";
import { participationLabel } from "@/app/gestao/desk-ui";
import type { DeskOrganization } from "@/infrastructure/participation/collection";

export const metadata = { title: "Órgãos" };

const card = "rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]";

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
        <RegisteredList organizations={[]} inCycleIds={new Set()} unknown />
      </Canvas>
    );
  }

  const { canManage, desk } = access;
  const inCycleIds = new Set(
    desk.organizations
      .filter((organization) => desk.cycles.some((cycle) => cycle.organizationIds.includes(organization.id)))
      .map((organization) => organization.id),
  );

  return (
    <Canvas notice="Gerencie os órgãos cadastrados e sua participação nos ciclos do PQVST.">
      <section id="novo-orgao" className={`${card} px-5 py-5 sm:px-6`}>
        <h2 className="text-lg font-semibold text-[#2c2a4a]">Novo órgão</h2>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">
          O cadastro guarda nome e sigla. A participação no ciclo é definida em Ciclos.
        </p>
        <div className="mt-5 max-w-md">
          {canManage ? (
            <CreateOrganizationForm />
          ) : (
            <p className="text-sm leading-6 text-[#7a7b90]">O cadastro de órgãos fica com a administração estadual.</p>
          )}
        </div>
      </section>
      <div className="mt-5">
        <RegisteredList organizations={desk.organizations} inCycleIds={inCycleIds} />
      </div>
    </Canvas>
  );
}

function Canvas({ notice, children }: { notice: string; children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8">
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Órgãos</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Órgãos do programa</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      {children}
    </div>
  );
}

function RegisteredList({
  organizations,
  inCycleIds,
  unknown = false,
}: {
  organizations: readonly DeskOrganization[];
  inCycleIds: ReadonlySet<string>;
  unknown?: boolean;
}) {
  const count = unknown ? "–" : participationLabel(organizations.length);
  return (
    <section className={`${card} px-5 py-5 sm:px-6`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#2c2a4a]">Órgãos cadastrados</h2>
        <p className="text-sm text-[#8b8ca3]">{count}</p>
      </div>
      {unknown ? (
        <p className="mt-5 text-sm leading-6 text-[#7a7b90]">Nenhum órgão é exibido enquanto o acesso não estiver disponível.</p>
      ) : organizations.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {organizations.map((organization) => (
            <li key={organization.id}>
              <OrganizationRow organization={organization} inCycle={inCycleIds.has(organization.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#7a7b90]">Não há órgão gravado. Nenhum exemplo foi inventado.</p>
      )}
    </section>
  );
}

function OrganizationRow({ organization, inCycle }: { organization: DeskOrganization; inCycle: boolean }) {
  return (
    <article className="rounded-2xl border border-[#f0eef8] px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#2c2a4a]">{organization.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#f7f6fd] px-2 py-1 text-xs font-medium tracking-wide text-[#5c5b73]">
              {organization.acronym}
            </span>
            <span className="inline-flex rounded-full bg-[#efeaff] px-2.5 py-1 text-xs font-medium text-[#5b4fd6]">Ativo</span>
            <span
              className={
                inCycle
                  ? "inline-flex rounded-full bg-[#e8f5e9] px-2.5 py-1 text-xs font-medium text-[#166534]"
                  : "inline-flex rounded-full bg-[#f7f6fd] px-2.5 py-1 text-xs font-medium text-[#5c5b73]"
              }
            >
              {inCycle ? "Em ciclo" : "Sem ciclo vinculado"}
            </span>
          </div>
        </div>
        <Link href="/gestao/ciclos" className="inline-flex items-center gap-1 text-sm font-semibold text-[#6d5efc] no-underline">
          Gerenciar órgão
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </article>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") {
    return "Enquanto a configuração do servidor estiver incompleta, nenhum órgão é exibido.";
  }
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. O cadastro de órgãos fica com a administração estadual.";
}
