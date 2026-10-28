import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { CredentialDesk } from "@/app/gestao/credenciais/credential-desk";
import { formatIsoDate, shell, shellButton } from "@/app/gestao/desk-ui";
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
      <Canvas notice={blockedNotice(access)}>
        <p className="text-sm leading-6 text-[#7a7b90]">Nenhuma credencial é gerada enquanto o acesso não estiver disponível.</p>
      </Canvas>
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

  return (
    <Canvas notice="Gere e acompanhe as credenciais utilizadas pelos servidores para responder ao questionário.">
      {access.desk.organizations.length === 0 ? (
        <div className="mb-5">
          <p className="text-sm leading-6 text-[#7a7b90]">Ainda não há órgão participante.</p>
          <Link href="/gestao/orgaos" className={`${shellButton} mt-4`}>
            Cadastrar órgão
          </Link>
        </div>
      ) : null}
      {access.desk.cycles.length === 0 ? (
        <div className="mb-5">
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
    </Canvas>
  );
}

function Canvas({ notice, children }: { notice: string; children: ReactNode }) {
  return (
    <div className={shell}>
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Credenciais</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Credenciais de participação</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      {children}
    </div>
  );
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") {
    return "Enquanto a configuração do servidor estiver incompleta, nenhuma credencial é gerada.";
  }
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. A administração estadual registra o quantitativo. O gestor emite as credenciais do próprio órgão.";
}
