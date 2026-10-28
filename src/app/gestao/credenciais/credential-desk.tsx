"use client";

import { useActionState, useState, type ReactNode } from "react";
import { issueCredentials, saveHeadcount, type FormState, type IssueState } from "@/app/gestao/coleta/actions";
import { shellButton, shellCard, shellField, shellNote } from "@/app/gestao/desk-ui";

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
  const remaining = population ? Math.max(population.headcount - (balance?.total ?? 0), 0) : null;
  const canIssue = Boolean(selected?.collecting && currentOrg && population && remaining !== null && remaining > 0);

  const [headcountState, saveAction, saving] = useActionState(saveHeadcount, idleForm);
  const [issueState, issueAction, issuing] = useActionState(issueCredentials, idleIssue);
  const [copied, setCopied] = useState(false);

  return (
    <section className={`${shellCard} px-5 py-6 sm:px-6`}>
      <Step number="1" title="Selecione a coleta">
        {selected ? (
          <div className="grid gap-4 sm:max-w-md">
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
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Órgão participante
              <select className={field} value={currentOrg} onChange={(event) => setOrganizationId(event.target.value)}>
                {orgs.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.acronym}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm leading-6 text-[#7a7b90]">
              {population
                ? `${population.headcount.toLocaleString("pt-BR")} servidores elegíveis. ${balance?.available ?? 0} credenciais ainda não usadas, ${balance?.consumed ?? 0} já consumidas.`
                : "O quantitativo de elegíveis ainda não foi registrado para este órgão."}
              {remaining !== null ? ` Cabem mais ${remaining.toLocaleString("pt-BR")}.` : ""}
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
      </Step>

      <Step number="2" title="Informe os servidores elegíveis">
        <p className="text-sm leading-6 text-[#7a7b90]">Informe quantos servidores podem participar desta coleta.</p>
        {canManage && selected && currentOrg ? (
          <form action={saveAction} className="mt-4 grid gap-4 sm:max-w-md">
            <input type="hidden" name="cycleId" value={selected.id} />
            <input type="hidden" name="organizationId" value={currentOrg} />
            <label className={labelClass}>
              Quantidade de servidores elegíveis
              <input name="headcount" type="number" required min={1} max={100000} placeholder="Ex: 150" className={field} />
            </label>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={shellButton}>
                {saving ? "Gravando…" : "Salvar quantidade"}
              </button>
            </div>
            {headcountState.error ? (
              <p role="alert" className={shellNote("error")}>
                {headcountState.error}
              </p>
            ) : null}
            {headcountState.notice ? <p className={shellNote("ok")}>{headcountState.notice}</p> : null}
          </form>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[#7a7b90]">
            O quantitativo de elegíveis é gravado pela administração estadual.
          </p>
        )}
      </Step>

      <Step number="3" title="Emita as credenciais">
        <p className="text-sm leading-6 text-[#7a7b90]">
          Após informar a quantidade de elegíveis, você poderá emitir as credenciais de participação.
        </p>
        {selected && currentOrg ? (
          <form action={issueAction} className="mt-4 grid gap-4 sm:max-w-md">
            <input type="hidden" name="cycleId" value={selected.id} />
            <input type="hidden" name="organizationId" value={currentOrg} />
            <label className={labelClass}>
              Quantidade
              <input
                name="quantity"
                type="number"
                required
                min={1}
                max={500}
                defaultValue={1}
                disabled={!canIssue}
                className={field}
              />
            </label>
            <button type="submit" disabled={issuing || !canIssue} className={shellButton}>
              {issuing ? "Emitindo…" : "Emitir credenciais"}
            </button>
            {issueState.error ? (
              <p role="alert" className={shellNote("error")}>
                {issueState.error}
              </p>
            ) : null}
          </form>
        ) : null}
        <p className="mt-4 text-sm leading-6 text-[#7a7b90]">
          As credenciais devem ser copiadas ou exportadas no momento da emissão, pois não poderão ser consultadas novamente.
        </p>
        {issueState.tokens.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:max-w-xl">
            <textarea
              readOnly
              value={issueState.tokens.join("\n")}
              className={`${field} h-48 font-mono`}
              aria-label="Credenciais emitidas"
            />
            <button
              type="button"
              className={shellButton}
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
          </div>
        ) : null}
      </Step>
    </section>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="border-t border-[#f0eef8] py-6 first:border-t-0 first:pt-0 last:pb-0">
      <h2 className="text-base font-semibold text-[#2c2a4a]">
        {number}. {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
