import { Suspense } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { OpenCycleForm } from "@/app/gestao/ciclos/open-cycle-form";
import {
  CycleStatus,
  ShellMetric,
  ShellPage,
  ShellTitle,
  formatIsoDate,
  participationLabel,
  shell,
  shellButton,
  shellCard,
  shellNote,
} from "@/app/gestao/desk-ui";

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
      <ShellPage kicker="Ciclos" title="Coleta" notice={blockedNotice(access)}>
        <MetricRow cycles={null} open={null} scheduled={null} published={null} />
      </ShellPage>
    );
  }

  const { canManage, desk } = access;
  const count = (status: "open" | "scheduled" | "published") => desk.cycles.filter((cycle) => cycle.status === status).length;

  return (
    <ShellPage
      kicker="Ciclos"
      title="Coleta"
      notice="Abrir a coleta grava o ciclo já aberto, com o formulário oficial e os órgãos escolhidos. A resposta só entra entre a abertura e o encerramento."
    >
      <MetricRow cycles={desk.cycles.length} open={count("open")} scheduled={count("scheduled")} published={count("published")} />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${shellCard} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <div className="flex items-center justify-between gap-3">
            <ShellTitle kicker="Andamento" title="Ciclos" />
            <Link href="/gestao/credenciais" className={`${shellButton} shrink-0 px-3.5 py-1.5 text-xs`}>
              Credenciais
            </Link>
          </div>
          {desk.cycles.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Ciclo</th>
                    <th className="pb-3 font-medium">Período</th>
                    <th className="pb-3 font-medium">Participação</th>
                    <th className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {desk.cycles.map((cycle) => (
                    <tr key={cycle.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4 font-medium text-[#2c2a4a]">{cycle.name}</td>
                      <td className="py-4 pr-4 text-[#7a7b90]">
                        {formatIsoDate(cycle.opensOn)} a {formatIsoDate(cycle.closesOn)}
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
            <p className={`mt-5 ${shellNote("muted")}`}>Nenhum ciclo foi aberto nesta instalação.</p>
          )}
        </section>
        <section className={`${shellCard} px-5 py-5 xl:sticky xl:top-4 xl:col-span-2`}>
          <ShellTitle kicker="Abertura" title="Abrir coleta" />
          <div className="mt-5">
            {canManage && desk.organizations.length > 0 ? <OpenCycleForm organizations={desk.organizations} /> : null}
            {canManage && desk.organizations.length === 0 ? (
              <div>
                <p className="text-sm leading-6 text-[#7a7b90]">Cadastre um órgão antes de abrir a coleta.</p>
                <Link href="/gestao/orgaos" className={`${shellButton} mt-4`}>
                  Ir para órgãos
                </Link>
              </div>
            ) : null}
            {!canManage ? <p className="text-sm leading-6 text-[#7a7b90]">Abrir a coleta é uma ação da administração estadual.</p> : null}
          </div>
        </section>
      </div>
    </ShellPage>
  );
}

function MetricRow({
  cycles,
  open,
  scheduled,
  published,
}: {
  cycles: number | null;
  open: number | null;
  scheduled: number | null;
  published: number | null;
}) {
  return (
    <section aria-label="Indicadores da coleta" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ShellMetric label="Ciclos" value={cycles} icon="cycle" />
      <ShellMetric label="Abertos" value={open} icon="check" />
      <ShellMetric label="Programados" value={scheduled} icon="list" />
      <ShellMetric label="Publicados" value={published} icon="plan" tone="accent" />
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
