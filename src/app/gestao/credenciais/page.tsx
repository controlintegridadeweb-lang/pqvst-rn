import { Suspense } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { CredentialDesk } from "@/app/gestao/credenciais/credential-desk";
import { ShellMetric, ShellPage, formatIsoDate, shell, shellButton } from "@/app/gestao/desk-ui";
import { CYCLE_STATE_LABELS } from "@/domain/cycles/cycle";
import { collectionIsOpen, todayInRioGrandeDoNorte } from "@/domain/privacy/issuance";

export const metadata = { title: "Credenciais" };

export default function CredentialsPage() {
  return (
    <Suspense fallback={<div className={shell} />}>
      <Credentials />
    </Suspense>
  );
}

async function Credentials() {
  const access = await readDeskAccess();
  if (access.status !== "ready") {
    return (
      <ShellPage kicker="Credenciais" title="Emissão" notice={blockedNotice(access)}>
        <MetricRow eligible={null} issued={null} available={null} consumed={null} />
      </ShellPage>
    );
  }

  const today = todayInRioGrandeDoNorte();
  const cycles = access.desk.cycles.map((cycle) => ({
    id: cycle.id,
    name: cycle.name,
    statusLabel: CYCLE_STATE_LABELS[cycle.status],
    opensLabel: formatIsoDate(cycle.opensOn),
    closesLabel: formatIsoDate(cycle.closesOn),
    acceptsHeadcount: cycle.status === "open",
    collecting: collectionIsOpen({
      cycleStatus: cycle.status,
      opensOn: cycle.opensOn,
      closesOn: cycle.closesOn,
      today,
    }),
    organizationIds: cycle.organizationIds,
  }));
  const eligible = access.desk.populations.reduce((sum, item) => sum + item.headcount, 0);
  const issued = access.desk.balances.reduce((sum, item) => sum + item.total, 0);
  const available = access.desk.balances.reduce((sum, item) => sum + item.available, 0);
  const consumed = access.desk.balances.reduce((sum, item) => sum + item.consumed, 0);

  return (
    <ShellPage
      kicker="Credenciais"
      title="Emissão"
      notice="O texto da credencial aparece só nesta emissão. A base guarda o hash, o órgão e o ciclo."
    >
      <MetricRow eligible={eligible} issued={issued} available={available} consumed={consumed} />
      {access.desk.organizations.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-[#7a7b90]">Ainda não há órgão participante.</p>
          <Link href="/gestao/orgaos" className={`${shellButton} mt-4`}>
            Cadastrar órgão
          </Link>
        </div>
      ) : null}
      {access.desk.cycles.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-[#7a7b90]">Ainda não há ciclo aberto.</p>
          <Link href="/gestao/ciclos" className={`${shellButton} mt-4`}>
            Abrir a coleta
          </Link>
        </div>
      ) : null}
      <CredentialDesk
        canManage={access.canManage}
        organizations={access.desk.organizations}
        cycles={cycles}
        populations={access.desk.populations}
        balances={access.desk.balances}
      />
    </ShellPage>
  );
}

function MetricRow({
  eligible,
  issued,
  available,
  consumed,
}: {
  eligible: number | null;
  issued: number | null;
  available: number | null;
  consumed: number | null;
}) {
  return (
    <section aria-label="Indicadores das credenciais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ShellMetric label="Elegíveis" value={eligible} icon="people" />
      <ShellMetric label="Emitidas" value={issued} icon="key" />
      <ShellMetric label="Disponíveis" value={available} icon="list" />
      <ShellMetric label="Usadas" value={consumed} icon="check" tone="accent" />
    </section>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") {
    return "Enquanto a configuração do servidor estiver incompleta, nenhuma credencial é gerada.";
  }
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. A administração estadual registra o quantitativo. O gestor emite as credenciais do próprio órgão.";
}
