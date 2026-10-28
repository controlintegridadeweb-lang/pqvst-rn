"use client";

import { useActionState, useState } from "react";
import { issueCredentials, saveHeadcount, type FormState, type IssueState } from "@/app/gestao/coleta/actions";
import { ShellTitle, shellButton, shellCard, shellField, shellNote } from "@/app/gestao/desk-ui";

const field = shellField;
const labelClass = "grid gap-2 text-sm font-medium text-[#5c5b73]";
const idleForm: FormState = { error: null, notice: null };
const idleIssue: IssueState = { error: null, notice: null, tokens: [] };

export interface CredentialDeskProps {
  canManage: boolean;
  organizations: readonly { id: string; name: string; acronym: string }[];
  cycles: readonly {
    id: string;
    name: string;
    statusLabel: string;
    opensLabel: string;
    closesLabel: string;
    acceptsHeadcount: boolean;
    collecting: boolean;
    organizationIds: readonly string[];
  }[];
  populations: readonly { cycleId: string; organizationId: string; headcount: number }[];
  balances: readonly { cycleId: string; organizationId: string; total: number; available: number; consumed: number }[];
}

export function CredentialDesk({ canManage, organizations, cycles, populations, balances }: CredentialDeskProps) {
  const editableCycles = cycles.filter((cycle) => cycle.acceptsHeadcount && cycle.organizationIds.length > 0);
  const firstCollecting = editableCycles.find((cycle) => cycle.collecting) ?? editableCycles[0];
  const [cycleId, setCycleId] = useState(firstCollecting?.id ?? "");
  const selected = editableCycles.find((cycle) => cycle.id === cycleId) ?? firstCollecting;
  const orgs = organizations.filter((organization) => selected?.organizationIds.includes(organization.id));
  const [organizationId, setOrganizationId] = useState(orgs[0]?.id ?? "");
  const currentOrg = orgs.some((organization) => organization.id === organizationId) ? organizationId : (orgs[0]?.id ?? "");
  const population = populations.find((item) => item.cycleId === selected?.id && item.organizationId === currentOrg);
  const balance = balances.find((item) => item.cycleId === selected?.id && item.organizationId === currentOrg);
  const remaining = population ? population.headcount - (balance?.total ?? 0) : null;

  const [headcountState, saveAction, saving] = useActionState(saveHeadcount, idleForm);
  const [issueState, issueAction, issuing] = useActionState(issueCredentials, idleIssue);
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-5">
      <div className="grid gap-5 xl:col-span-3">
        <section className={`${shellCard} px-5 py-5 sm:px-6`}>
          <ShellTitle kicker="Saldo" title="Por órgão e ciclo" />
          <div className="mt-5">
            <BalanceTable organizations={organizations} cycles={cycles} populations={populations} balances={balances} />
          </div>
        </section>
        {issueState.tokens.length > 0 ? (
          <section className={`${shellCard} px-5 py-5 sm:px-6`}>
            <ShellTitle kicker="Uma vez" title="Copie agora" />
            <p className="mt-2 text-sm leading-6 text-[#7a7b90]">
              Cada linha é uma credencial de uso único. A base guarda só o hash. Se esta tela for fechada, a lista não volta.
            </p>
            <textarea
              readOnly
              value={issueState.tokens.join("\n")}
              className={`${field} mt-4 h-48 font-mono`}
              aria-label="Credenciais emitidas"
            />
            <button
              type="button"
              className={`${shellButton} mt-4`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(issueState.tokens.join("\n"));
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Lista copiada" : "Copiar lista"}
            </button>
          </section>
        ) : null}
      </div>
      <div className="grid gap-5 xl:sticky xl:top-4 xl:col-span-2">
        <section className={`${shellCard} px-5 py-5`}>
          <ShellTitle kicker="Seleção" title="Ciclo e órgão" />
          <div className="mt-5">
            {selected ? (
              <div className="grid gap-4">
                <label className={labelClass}>
                  Ciclo
                  <select
                    className={field}
                    value={selected.id}
                    onChange={(event) => {
                      setCycleId(event.target.value);
                      setOrganizationId("");
                    }}
                  >
                    {editableCycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name} · {cycle.statusLabel} · {cycle.opensLabel} a {cycle.closesLabel}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Órgão
                  <select className={field} value={currentOrg} onChange={(event) => setOrganizationId(event.target.value)}>
                    {orgs.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.acronym} — {organization.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={shellNote("muted")}>
                  {population
                    ? `${population.headcount} servidores elegíveis. ${balance?.available ?? 0} credenciais ainda não usadas, ${balance?.consumed ?? 0} já consumidas.`
                    : "O quantitativo de elegíveis ainda não foi registrado para este órgão."}
                  {remaining !== null ? ` Cabem mais ${Math.max(remaining, 0)}.` : ""}
                </p>
                {selected && !selected.collecting ? (
                  <p className="text-sm leading-6 text-[#7a7b90]">
                    A emissão e o envio ficam disponíveis de {selected.opensLabel} a {selected.closesLabel}.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className={shellNote("muted")}>Nenhum ciclo com órgão participante está disponível para este perfil.</p>
            )}
          </div>
        </section>

        {canManage && selected && currentOrg ? (
          <section className={`${shellCard} px-5 py-5`}>
            <ShellTitle kicker="Elegíveis" title="Quantitativo" />
            <form action={saveAction} className="mt-5 grid gap-4">
              <input type="hidden" name="cycleId" value={selected.id} />
              <input type="hidden" name="organizationId" value={currentOrg} />
              <label className={labelClass}>
                Servidores elegíveis
                <input name="headcount" type="number" required min={1} max={100000} className={field} />
              </label>
              <label className={labelClass}>
                Fonte do número
                <input name="sourceNote" required minLength={5} maxLength={300} className={field} />
              </label>
              <button type="submit" disabled={saving} className={shellButton}>
                {saving ? "Gravando…" : "Registrar quantitativo"}
              </button>
              {headcountState.error ? (
                <p role="alert" className={shellNote("error")}>
                  {headcountState.error}
                </p>
              ) : null}
              {headcountState.notice ? <p className={shellNote("ok")}>{headcountState.notice}</p> : null}
            </form>
          </section>
        ) : null}

        {selected?.collecting && currentOrg && population ? (
          <section className={`${shellCard} px-5 py-5`}>
            <ShellTitle kicker="Uso único" title="Emitir credenciais" />
            <form action={issueAction} className="mt-5 grid gap-4">
              <input type="hidden" name="cycleId" value={selected.id} />
              <input type="hidden" name="organizationId" value={currentOrg} />
              <label className={labelClass}>
                Quantidade
                <input name="quantity" type="number" required min={1} max={500} defaultValue={1} className={field} />
              </label>
              <button type="submit" disabled={issuing} className={shellButton}>
                {issuing ? "Emitindo…" : "Gerar credenciais"}
              </button>
              {issueState.error ? (
                <p role="alert" className={shellNote("error")}>
                  {issueState.error}
                </p>
              ) : null}
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function BalanceTable({
  organizations,
  cycles,
  populations,
  balances,
}: Pick<CredentialDeskProps, "organizations" | "cycles" | "populations" | "balances">) {
  const rows = cycles.flatMap((cycle) =>
    cycle.organizationIds.map((organizationId) => {
      const organization = organizations.find((item) => item.id === organizationId);
      const population = populations.find((item) => item.cycleId === cycle.id && item.organizationId === organizationId);
      const balance = balances.find((item) => item.cycleId === cycle.id && item.organizationId === organizationId);
      return {
        key: `${cycle.id}-${organizationId}`,
        cycle: cycle.name,
        organization: organization ? `${organization.acronym}` : "Órgão",
        eligible: population?.headcount ?? null,
        available: balance?.available ?? 0,
        consumed: balance?.consumed ?? 0,
        room: population ? population.headcount - (balance?.total ?? 0) : null,
      };
    }),
  );
  if (rows.length === 0) {
    return <p className={shellNote("muted")}>Nenhum órgão participante neste ciclo.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Credenciais por órgão e ciclo</caption>
        <thead>
          <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
            <th className="pb-3 font-medium">Órgão</th>
            <th className="pb-3 font-medium">Ciclo</th>
            <th className="pb-3 font-medium">Elegíveis</th>
            <th className="pb-3 font-medium">Disponíveis</th>
            <th className="pb-3 font-medium">Usadas</th>
            <th className="pb-3 font-medium">Ainda cabe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-[#f4f3f8]">
              <td className="py-4 pr-4 font-medium text-[#2c2a4a]">{row.organization}</td>
              <td className="py-4 pr-4 text-[#7a7b90]">{row.cycle}</td>
              <td className="py-4 pr-4 text-[#7a7b90]">{row.eligible ?? "—"}</td>
              <td className="py-4 pr-4 text-[#7a7b90]">{row.available}</td>
              <td className="py-4 pr-4 text-[#7a7b90]">{row.consumed}</td>
              <td className="py-4 text-[#7a7b90]">{row.room ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
