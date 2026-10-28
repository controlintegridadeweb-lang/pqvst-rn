import { Suspense } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { ActionDraftForm, DiscloseButton } from "@/app/gestao/planos/action-draft-form";
import { ACTION_STATUS_LABELS } from "@/domain/action-plans/action-item";
import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { ShellMetric, ShellPage, ShellTitle, shell, shellButton, shellCard, shellNote } from "@/app/gestao/desk-ui";
import { listActions } from "@/infrastructure/action-plans/store";

export const metadata = { title: "Planos de ação" };

export default function PlansPage() {
  return (
    <Suspense fallback={<div className={shell} />}>
      <Plans />
    </Suspense>
  );
}

async function Plans() {
  const access = await readDeskAccess();
  if (access.status !== "ready") {
    return (
      <ShellPage kicker="Planos" title="Ações de melhoria" notice={blockedNotice(access)}>
        <MetricRow recorded={null} running={null} completed={null} />
      </ShellPage>
    );
  }

  const scope = access.canManage ? "all" : access.desk.organizations.map((organization) => organization.id);
  const listed = await listActions(scope);
  const actions = listed.ok ? listed.value : null;
  const rows = actions ?? [];
  const cycles = access.desk.cycles.filter((cycle) => cycle.organizationIds.length > 0);
  const participatingIds = new Set(cycles.flatMap((cycle) => cycle.organizationIds));
  const organizations = access.desk.organizations.filter((organization) => participatingIds.has(organization.id));

  return (
    <ShellPage
      kicker="Planos"
      title="Ações de melhoria"
      notice="Registrar a ação não altera o IQVST. A página pública só recebe a ação quando a administração estadual autoriza a divulgação."
    >
      <MetricRow
        recorded={actions ? actions.length : null}
        running={actions ? actions.filter((item) => item.status === "in_progress").length : null}
        completed={actions ? actions.filter((item) => item.status === "completed").length : null}
      />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${shellCard} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <ShellTitle kicker="Órgão" title="Ações do órgão" />
          {!listed.ok ? <p className={`mt-5 ${shellNote("error")}`}>{listed.error.message}</p> : null}
          {listed.ok && rows.length === 0 ? (
            <p className={`mt-5 ${shellNote("muted")}`}>Nenhuma ação foi gravada nesta instalação.</p>
          ) : null}
          {rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Ação</th>
                    <th className="pb-3 font-medium">Órgão</th>
                    <th className="pb-3 font-medium">Situação</th>
                    <th className="pb-3 font-medium">Público</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4">
                        <p className="font-medium text-[#2c2a4a]">{item.description}</p>
                        <p className="text-xs text-[#8b8ca3]">
                          {item.axis} · {item.cycleName}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-[#7a7b90]">{item.organizationAcronym}</td>
                      <td className="py-4 pr-4 text-[#7a7b90]">{ACTION_STATUS_LABELS[item.status]}</td>
                      <td className="py-4">
                        {access.canManage ? (
                          <DiscloseButton id={item.id} disclosed={item.publicDisclosure} />
                        ) : (
                          <span className="text-[#7a7b90]">{item.publicDisclosure ? "Divulgada" : "Interna"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        <section className={`${shellCard} px-5 py-5 xl:sticky xl:top-4 xl:col-span-2`}>
          <ShellTitle kicker="Registro" title="Registrar ação" />
          <div className="mt-5">
            {organizations.length > 0 && cycles.length > 0 ? (
              <ActionDraftForm organizations={organizations} cycles={cycles} />
            ) : (
              <div>
                <p className="text-sm leading-6 text-[#7a7b90]">A ação precisa de um órgão participante de um ciclo.</p>
                <Link href="/gestao/ciclos" className={`${shellButton} mt-4`}>
                  Ir para ciclos
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </ShellPage>
  );
}

function MetricRow({
  recorded,
  running,
  completed,
}: {
  recorded: number | null;
  running: number | null;
  completed: number | null;
}) {
  return (
    <section aria-label="Indicadores das ações" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ShellMetric label="Ações gravadas" value={recorded} icon="plan" />
      <ShellMetric label="Eixos" value={OFFICIAL_AXES.length} icon="list" />
      <ShellMetric label="Em execução" value={running} icon="cycle" />
      <ShellMetric label="Concluídas" value={completed} icon="check" tone="accent" />
    </section>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") return "Enquanto a configuração do servidor estiver incompleta, nenhuma ação é exibida.";
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional para registrar a ação do órgão.";
}
