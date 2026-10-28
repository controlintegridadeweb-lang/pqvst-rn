import { Suspense, type ReactNode } from "react";
import { ACTION_STATUS_LABELS } from "@/domain/action-plans/action-item";
import { listDisclosedActions, type DisclosedAction } from "@/infrastructure/action-plans/store";

export const metadata = { title: "Ações de melhoria" };

const NOTES = [
  "O andamento de uma ação não é o IQVST.",
  "Um plano pode avançar sem que a percepção do ciclo seguinte já tenha mudado, e o contrário também pode ocorrer.",
  "Registros internos da Comissão Executiva Local não aparecem nesta página.",
];

export default function ActionsPage() {
  return (
    <Suspense fallback={<ActionsView actions={null} ready={false} />}>
      <PublishedActions />
    </Suspense>
  );
}

async function PublishedActions() {
  const listed = await listDisclosedActions();
  return <ActionsView actions={listed.ok ? listed.value : []} ready={listed.ok} />;
}

function ActionsView({ actions, ready }: { actions: DisclosedAction[] | null; ready: boolean }) {
  const rows = actions ?? [];
  const indicators = [
    { label: "Ações divulgadas", value: ready ? String(rows.length) : "Aguardando", hint: "Autorizadas para esta página" },
    { label: "Órgãos", value: ready ? String(new Set(rows.map((item) => item.organizationAcronym)).size) : "Aguardando", hint: "Com ação pública" },
    { label: "Ciclos", value: ready ? String(new Set(rows.map((item) => item.cycleName)).size) : "Aguardando", hint: "De origem da providência" },
    { label: "Eixos", value: ready ? String(new Set(rows.map((item) => item.axis)).size) : "Aguardando", hint: "Citados nas ações" },
  ];

  return (
    <div className="overflow-x-hidden bg-[#fbf7f8] pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-5">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-sm font-medium text-[#d12d6c]">Providências</p>
            <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight text-[#241820] md:text-3xl">
              Ações institucionais autorizadas para divulgação.
            </h1>
          </div>
          <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs text-[#7d6a73] ring-1 ring-[#f3e4ea]">
            {ready && rows.length > 0 ? `${rows.length.toLocaleString("pt-BR")} divulgadas` : "Aguardando publicação"}
          </p>
        </header>

        <section aria-label="Indicadores das ações divulgadas" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {indicators.map((item) => (
            <article
              key={item.label}
              aria-label={item.value === "Aguardando" ? `${item.label}: não disponível` : `${item.label}: ${item.value}`}
              className="min-w-0 rounded-2xl bg-white px-3 py-4 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] sm:px-4"
            >
              <h2 className="text-sm leading-5 text-[#7d6a73]">{item.label}</h2>
              <p
                className={`mt-3 tracking-tight ${item.value === "Aguardando" ? "text-lg font-medium text-[#c9a3b2]" : "text-3xl leading-none font-semibold text-[#241820]"}`}
                aria-hidden="true"
              >
                {item.value}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#8a7380]">{item.hint}</p>
            </article>
          ))}
        </section>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Ações públicas" subtitle="Somente o que a comissão autorizou divulgar.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[#8a7380]">
                    <th scope="col" className="pb-3 pr-3 font-medium">Ação</th>
                    <th scope="col" className="pb-3 pr-3 font-medium">Órgão</th>
                    <th scope="col" className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr className="border-t border-[#f6eef2]">
                      <td colSpan={3} className="py-4 text-sm leading-6 text-[#6d5a63]">
                        Nenhuma ação foi marcada para divulgação. Registros internos da Comissão Executiva Local não aparecem nesta página.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => (
                      <tr key={item.id} className="border-t border-[#f6eef2]">
                        <th scope="row" className="py-3 pr-3 font-medium text-[#241820]">
                          {item.description}
                          <span className="mt-1 block text-xs font-normal text-[#8a7380]">
                            {item.axis} · {item.cycleName}
                          </span>
                        </th>
                        <td className="py-3 pr-3 text-[#3f2c34]">{item.organizationAcronym}</td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-[#fde7f0] px-2.5 py-1 text-xs text-[#a41f52]">
                            {ACTION_STATUS_LABELS[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Como ler" subtitle="A providência e o indicador medem coisas diferentes.">
            <ul className="space-y-2.5">
              {NOTES.map((notice) => (
                <li key={notice} className="flex gap-3 text-sm leading-6 text-[#6d5a63]">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b3c8]" />
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(120,30,60,0.05)] ring-1 ring-[#f3e4ea] ${className}`}>
      <h2 className="text-base font-semibold text-[#241820]">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-[#7d6a73]">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
