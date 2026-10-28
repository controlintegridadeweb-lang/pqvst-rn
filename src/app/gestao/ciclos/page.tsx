import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { OpenCycleForm } from "@/app/gestao/ciclos/open-cycle-form";
import { CycleStatus, formatIsoDate, participationLabel, shell, shellButton, shellCard } from "@/app/gestao/desk-ui";
import type { DeskCycle } from "@/infrastructure/participation/collection";

export const metadata = { title: "Ciclos" };

export default function CyclesPage() {
  return (
    <Suspense fallback={<div className={shell} />}>
      <Cycles />
    </Suspense>
  );
}

async function Cycles() {
  const access = await readDeskAccess();
  if (access.status !== "ready") {
    return (
      <Canvas notice={blockedNotice(access)}>
        <RegisteredCycles cycles={[]} unknown />
      </Canvas>
    );
  }

  const { canManage, desk } = access;

  return (
    <Canvas notice="Organize os períodos de aplicação do questionário e acompanhe as coletas do PQVST.">
      <section id="novo-ciclo" className={`${shellCard} px-5 py-5 sm:px-6`}>
        <h2 className="text-lg font-semibold text-[#2c2a4a]">Novo ciclo</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a7b90]">
          Abrir a coleta grava o ciclo já aberto, com o formulário oficial e os órgãos escolhidos. A resposta só entra
          entre a abertura e o encerramento.
        </p>
        <div className="mt-5 max-w-xl">
          {canManage && desk.organizations.length > 0 ? <OpenCycleForm organizations={desk.organizations} /> : null}
          {canManage && desk.organizations.length === 0 ? (
            <div>
              <p className="text-sm leading-6 text-[#7a7b90]">Cadastre um órgão antes de abrir a coleta.</p>
              <Link href="/gestao/orgaos" className={`${shellButton} mt-4`}>
                Ir para órgãos
              </Link>
            </div>
          ) : null}
          {!canManage ? (
            <p className="text-sm leading-6 text-[#7a7b90]">Abrir a coleta é uma ação da administração estadual.</p>
          ) : null}
        </div>
      </section>
      <div className="mt-5">
        <RegisteredCycles cycles={desk.cycles} />
      </div>
    </Canvas>
  );
}

function Canvas({ notice, children }: { notice: string; children: ReactNode }) {
  return (
    <div className={shell}>
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Ciclos</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Ciclos de coleta</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      {children}
    </div>
  );
}

function RegisteredCycles({ cycles, unknown = false }: { cycles: readonly DeskCycle[]; unknown?: boolean }) {
  const count = unknown ? "–" : cycles.length === 1 ? "1 ciclo" : `${cycles.length.toLocaleString("pt-BR")} ciclos`;
  return (
    <section className={`${shellCard} px-5 py-5 sm:px-6`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#2c2a4a]">Ciclos cadastrados</h2>
        <p className="rounded-full bg-[#f7f6fd] px-3 py-1 text-xs font-medium text-[#5c5b73]">{count}</p>
      </div>
      {unknown ? (
        <p className="mt-8 mb-6 text-center text-sm leading-6 text-[#7a7b90]">
          Nenhum ciclo é exibido enquanto o acesso não estiver disponível.
        </p>
      ) : cycles.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {cycles.map((cycle) => (
            <li key={cycle.id}>
              <article className="rounded-2xl border border-[#f0eef8] px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#2c2a4a]">{cycle.name}</h3>
                    <p className="mt-1 text-sm text-[#7a7b90]">
                      {formatIsoDate(cycle.opensOn)} a {formatIsoDate(cycle.closesOn)}
                      {" · "}
                      {participationLabel(cycle.organizationIds.length)}
                    </p>
                  </div>
                  <CycleStatus status={cycle.status} />
                </div>
                <Link
                  href="/gestao/credenciais"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#6d5efc] no-underline"
                >
                  Credenciais
                  <span aria-hidden="true">›</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#efeaff] text-[#6d5efc]">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="mt-4 text-base font-semibold text-[#2c2a4a]">Nenhum ciclo cadastrado</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7a7b90]">
            Crie um ciclo para definir o período da coleta e selecionar os órgãos participantes.
          </p>
        </div>
      )}
    </section>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") {
    return "Enquanto a configuração do servidor estiver incompleta, a coleta não abre.";
  }
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. Abrir a coleta é uma ação da administração estadual.";
}
