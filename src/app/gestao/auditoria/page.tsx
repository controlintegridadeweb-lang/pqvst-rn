import { Suspense } from "react";
import { ShellMetric, ShellPage, ShellTitle, shell, shellCard, shellNote } from "@/app/gestao/desk-ui";
import { listAuditEntries } from "@/infrastructure/audit/log";
import { readInstitutionalAccess } from "@/infrastructure/auth/session";

export const metadata = { title: "Auditoria" };

const ACTION_LABEL: Record<string, string> = {
  organization_created: "Órgão cadastrado",
  cycle_opened: "Coleta aberta",
  headcount_recorded: "Quantitativo registrado",
  credentials_issued: "Credenciais emitidas",
  member_created: "Membro vinculado",
  action_recorded: "Ação registrada",
  action_disclosed: "Divulgação alterada",
};

const ENTITY_LABEL: Record<string, string> = {
  organizations: "Órgão",
  survey_cycles: "Ciclo",
  eligible_populations: "Elegíveis",
  participation_credentials: "Credenciais",
  organization_memberships: "Membro",
  action_items: "Ação",
};

const OUTSIDE = ["Conteúdo do diagnóstico.", "Token da credencial.", "Identificadores pessoais de quem participa."];

export default function AuditPage() {
  return (
    <Suspense fallback={<div className={shell} />}>
      <Audit />
    </Suspense>
  );
}

async function Audit() {
  const access = await readInstitutionalAccess();
  if (access.status !== "ready" || access.session.role !== "state_admin") {
    return (
      <ShellPage
        kicker="Auditoria"
        title="Trilha administrativa"
        notice="A trilha administrativa fica com a administração estadual. Ela registra a ação, não a resposta, o token ou o identificador de quem participa."
      >
        <MetricRow events={null} registrations={null} collection={null} publications={null} />
      </ShellPage>
    );
  }

  const listed = await listAuditEntries();
  const entries = listed.ok ? listed.value : [];
  const registrations = entries.filter(
    (entry) => entry.action === "organization_created" || entry.action === "member_created" || entry.action === "action_recorded",
  ).length;
  const collection = entries.filter(
    (entry) => entry.action === "cycle_opened" || entry.action === "headcount_recorded" || entry.action === "credentials_issued",
  ).length;
  const publications = entries.filter((entry) => entry.action === "action_disclosed").length;

  return (
    <ShellPage
      kicker="Auditoria"
      title="Trilha administrativa"
      notice="A auditoria registra a ação administrativa, não a resposta. O token e identificadores de quem participa ficam fora do registro."
    >
      <MetricRow events={entries.length} registrations={registrations} collection={collection} publications={publications} />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${shellCard} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <ShellTitle kicker="Registro" title="Trilha" />
          {!listed.ok ? <p className={`mt-5 ${shellNote("error")}`}>{listed.error.message}</p> : null}
          {listed.ok && entries.length === 0 ? (
            <p className={`mt-5 ${shellNote("muted")}`}>Não há eventos administrativos para mostrar.</p>
          ) : null}
          {entries.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Quando</th>
                    <th className="pb-3 font-medium">Ação</th>
                    <th className="pb-3 font-medium">Escopo</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4 text-[#7a7b90]">{formatWhen(entry.createdAt)}</td>
                      <td className="py-4 pr-4 font-medium text-[#2c2a4a]">{ACTION_LABEL[entry.action] ?? entry.action}</td>
                      <td className="py-4 text-[#7a7b90]">{ENTITY_LABEL[entry.entity] ?? entry.entity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        <section className={`${shellCard} px-5 py-5 xl:sticky xl:top-4 xl:col-span-2`}>
          <ShellTitle kicker="Limite" title="Fora do registro" />
          <ul className="mt-5 grid gap-2">
            {OUTSIDE.map((item) => (
              <li key={item} className="rounded-2xl bg-[#f7f6fd] px-4 py-3 text-sm leading-6 text-[#5c5b73]">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ShellPage>
  );
}

function MetricRow({
  events,
  registrations,
  collection,
  publications,
}: {
  events: number | null;
  registrations: number | null;
  collection: number | null;
  publications: number | null;
}) {
  return (
    <section aria-label="Indicadores da auditoria" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ShellMetric label="Eventos" value={events} icon="shield" />
      <ShellMetric label="Cadastros" value={registrations} icon="key" />
      <ShellMetric label="Coleta" value={collection} icon="list" />
      <ShellMetric label="Divulgações" value={publications} icon="check" tone="accent" />
    </section>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(date);
}
