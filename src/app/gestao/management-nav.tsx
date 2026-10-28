"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AppRole } from "@/domain/access/permissions";

const MODULES = [
  ["Início", "/gestao", "Visão da administração.", "home"],
  ["Órgãos", "/gestao/orgaos", "Cadastro e situação de participação.", "building"],
  ["Membros", "/gestao/membros", "Titulares, suplentes e demais responsáveis.", "people"],
  ["Questionários", "/gestao/questionarios", "Importação validada, sem perguntas inventadas.", "list"],
  ["Ciclos", "/gestao/ciclos", "Rascunho, abertura, encerramento e publicação.", "cycle"],
  ["Credenciais", "/gestao/credenciais", "Emissão de uso único para o ciclo aberto.", "key"],
  ["Planos", "/gestao/planos", "Ações de melhoria do órgão.", "plan"],
  ["Auditoria", "/gestao/auditoria", "Trilha administrativa, sem conteúdo sensível.", "shield"],
] as const;

type ModuleIcon = (typeof MODULES)[number][3];

const ROLE_LABEL = {
  state_admin: "Administrador estadual",
  org_manager: "Gestor de órgão",
} as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/gestao") return pathname === "/gestao";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagementNav({ role, fullName }: { role: AppRole | null; fullName: string | null }) {
  const pathname = usePathname();
  const signedIn = Boolean(role && fullName);

  return (
    <div className="flex min-h-[28rem] flex-col rounded-[2rem] bg-white px-4 py-6 text-[#3c3a55] shadow-[0_12px_32px_rgba(80,70,140,0.06)] lg:sticky lg:top-4 lg:h-[calc(100vh-6.5rem)] lg:min-h-0">
      <p className="px-3 text-2xl font-semibold tracking-tight text-[#2c2a4a]">PQVST.</p>
      <nav aria-label="Gestão" className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {MODULES.map(([label, href, , icon]) => {
          const current = isCurrent(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "flex items-center gap-3 rounded-full bg-[#efeaff] px-4 py-3 text-sm font-semibold text-[#5b4fd6] no-underline"
                  : "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-[#5c5b73] no-underline hover:bg-[#f6f5fb]"
              }
            >
              <NavIcon name={icon} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 shrink-0 rounded-3xl bg-[#f7f6fd] p-4">
        <p className="text-sm font-semibold text-[#2c2a4a]">{signedIn ? fullName : "Entrada institucional"}</p>
        <p className="mt-1 text-xs leading-5 text-[#7a7b90]">
          {signedIn && role ? ROLE_LABEL[role] : "Entre para abrir a gestão do programa."}
        </p>
        <Link
          href={signedIn ? "/" : "/acesso"}
          className="on-pink mt-4 block rounded-full bg-[#6d5efc] px-4 py-2.5 text-center text-sm font-semibold text-white no-underline"
        >
          {signedIn ? "Voltar ao site" : "Entrar"}
        </Link>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: ModuleIcon }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {iconPaths(name)}
    </svg>
  );
}

function iconPaths(name: ModuleIcon): ReactNode {
  if (name === "home") {
    return <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />;
  }
  if (name === "building") {
    return (
      <>
        <path d="M4 20h16M6 20V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V20" />
        <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01M10 20v-3h4v3" strokeLinecap="round" />
      </>
    );
  }
  if (name === "people") {
    return (
      <path
        d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12zM3.5 19a4.5 4.5 0 0 1 9 0m1.2-1.2a4.2 4.2 0 0 1 7.3 1.2"
        strokeLinecap="round"
      />
    );
  }
  if (name === "list") {
    return <path d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01" strokeLinecap="round" />;
  }
  if (name === "cycle") {
    return (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2" strokeLinecap="round" />
      </>
    );
  }
  if (name === "key") {
    return (
      <>
        <circle cx="8" cy="14" r="4" />
        <path d="M11.5 12.5 20 4m0 0h-3.5M20 4v3.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }
  if (name === "plan") {
    return (
      <>
        <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
        <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}
