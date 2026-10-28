import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { readDeskAccess } from "@/app/gestao/coleta/load";
import { MemberForm } from "@/app/gestao/membros/member-form";
import { MEMBER_SEAT_LABELS, type MemberSeat } from "@/domain/access/member";
import { listMembers, type MemberRecord } from "@/infrastructure/auth/members";

export const metadata = { title: "Membros" };

const card = "rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]";

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8]" />}>
      <Members />
    </Suspense>
  );
}

async function Members() {
  const access = await readDeskAccess();
  if (access.status !== "ready") {
    return (
      <Canvas notice={blockedNotice(access)}>
        <section aria-label="Indicadores de membros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Vínculos" value={null} />
          <Metric label="Titulares" value={null} />
          <Metric label="Suplentes" value={null} />
          <Metric label="Responsáveis" value={null} tone="accent" />
        </section>
      </Canvas>
    );
  }

  const scope = access.canManage ? "all" : access.desk.organizations.map((organization) => organization.id);
  const listed = await listMembers(scope);
  const members = listed.ok ? listed.value : null;
  const rows = members ?? [];
  const active = rows.filter((member) => member.status === "active");
  const notice = listed.ok
    ? "O vínculo grava a pessoa no órgão. A gestão local usa essa conta, não um órgão escolhido no navegador."
    : listed.error.message;

  return (
    <Canvas notice={notice}>
      <section aria-label="Indicadores de membros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Vínculos" value={members ? active.length : null} />
        <Metric label="Titulares" value={members ? countSeat(active, "titular") : null} />
        <Metric label="Suplentes" value={members ? countSeat(active, "suplente") : null} />
        <Metric label="Responsáveis" value={members ? countSeat(active, "member") : null} tone="accent" />
      </section>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-5">
        <section className={`${card} px-5 py-5 sm:px-6 xl:col-span-3`}>
          <SectionTitle kicker="Pessoas" title="Membros" />
          {rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium tracking-wide text-[#9a9bb0] uppercase">
                    <th className="pb-3 font-medium">Nome</th>
                    <th className="pb-3 font-medium">Vínculo</th>
                    <th className="pb-3 font-medium">Órgão</th>
                    <th className="pb-3 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <tr key={member.id} className="border-t border-[#f4f3f8]">
                      <td className="py-4 pr-4">
                        <span className="flex items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#efeaff] text-xs font-semibold text-[#6d5efc]">
                            {initials(member.fullName)}
                          </span>
                          <span className="pt-2 font-medium text-[#2c2a4a]">{member.fullName}</span>
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[#7a7b90]">{MEMBER_SEAT_LABELS[member.seat]}</td>
                      <td className="py-4 pr-4 text-sm leading-5 text-[#5c5b73]">
                        {member.organizationName}
                        <span className="mt-0.5 block text-xs tracking-wide text-[#8b8ca3]">{member.organizationAcronym}</span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex rounded-full bg-[#efeaff] px-2.5 py-1 text-xs font-medium text-[#5b4fd6]">
                          {member.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#f7f6fd] px-5 py-8 text-sm leading-6 text-[#7a7b90]">
              Nenhum vínculo de membro foi cadastrado nesta instalação.
            </p>
          )}
        </section>

        <section className={`${card} overflow-hidden xl:col-span-2`}>
          <div className="bg-gradient-to-br from-[#efeaff] via-[#f8f6ff] to-[#fff5f8] px-5 py-5">
            <SectionTitle kicker="Acesso" title="Vincular membro" />
          </div>
          <div className="p-5">
            {access.canManage && access.desk.organizations.length > 0 ? (
              <MemberForm organizations={access.desk.organizations} />
            ) : null}
            {access.canManage && access.desk.organizations.length === 0 ? (
              <p className="text-sm leading-6 text-[#7a7b90]">
                Cadastre um órgão antes de vincular alguém.
                <Link href="/gestao/orgaos" className="mt-3 block text-sm font-semibold text-[#6d5efc] no-underline">
                  Ir para órgãos
                </Link>
              </p>
            ) : null}
            {!access.canManage ? (
              <p className="text-sm leading-6 text-[#7a7b90]">
                O vínculo de titular, suplente e responsável é gravado pela administração estadual.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </Canvas>
  );
}

function Canvas({ notice, children }: { notice: string; children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8">
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">Membros</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">Vínculos do órgão</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      {children}
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8b8ca3] uppercase">{kicker}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-[#2c2a4a]">{title}</h2>
    </div>
  );
}

function Metric({ label, value, tone = "plain" }: { label: string; value: number | null; tone?: "plain" | "accent" }) {
  const accent = tone === "accent";
  return (
    <article
      className={
        accent
          ? "flex min-h-28 flex-col justify-center rounded-[1.6rem] bg-[#6d5efc] px-5 py-5 text-white shadow-[0_10px_24px_rgba(109,94,252,0.22)]"
          : `${card} flex min-h-28 flex-col justify-center px-5 py-5`
      }
    >
      <p className={`text-3xl font-semibold tracking-tight tabular-nums ${accent ? "text-white" : "text-[#2c2a4a]"}`}>
        {value === null ? "–" : value.toLocaleString("pt-BR")}
      </p>
      <p className={`mt-1 text-sm ${accent ? "text-white/85" : "text-[#7a7b90]"}`}>{label}</p>
    </article>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return letters.toUpperCase() || "–";
}

function countSeat(members: readonly MemberRecord[], seat: MemberSeat) {
  return members.filter((member) => member.seat === seat).length;
}

function blockedNotice(access: { status: string; message?: string }) {
  if (access.status === "closed") return "Enquanto a configuração do servidor estiver incompleta, nenhum vínculo é exibido.";
  if (access.status === "error") return access.message ?? "A base não respondeu.";
  return "Entre com um papel institucional. O cadastro de membros fica com a administração estadual.";
}
