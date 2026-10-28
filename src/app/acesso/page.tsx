import { Suspense } from "react";
import Link from "next/link";
import { AccessCard } from "@/app/acesso/access-card";
import { signOut } from "@/app/acesso/actions";
import { BootstrapAdminForm } from "@/app/acesso/bootstrap-admin-form";
import { LoginForm } from "@/app/acesso/login-form";
import { PageHeader } from "@/components/page-header";
import { stateAdminExists } from "@/infrastructure/auth/provision";
import { readInstitutionalAccess } from "@/infrastructure/auth/session";
import { adminRuntimeStatus, isAdminEntryOpen } from "@/infrastructure/publication-status";

export const metadata = { title: "Acesso restrito" };

const ROLE_LABEL = {
  state_admin: "Administrador estadual",
  org_manager: "Gestor de órgão",
} as const;

export default function AccessPage() {
  const status = adminRuntimeStatus();
  if (!isAdminEntryOpen(status)) {
    return <ClosedEntry status={status} />;
  }

  return (
    <section className="bg-[#fff7f9] px-4 py-10 md:py-16">
      <Suspense fallback={<p className="text-center text-sm text-muted">Abrindo a entrada…</p>}>
        <OpenEntry />
      </Suspense>
    </section>
  );
}

async function OpenEntry() {
  const access = await readInstitutionalAccess();
  if (access.status === "ready") {
    return (
      <AccessCard>
        <div className="grid w-full gap-4 text-center">
          <h1 className="text-xl font-semibold text-ink underline decoration-2 underline-offset-4">Entrar</h1>
          <p className="text-sm leading-6 text-muted">
            {access.session.fullName} entrou como {ROLE_LABEL[access.session.role]}.
          </p>
          <Link href="/gestao" className="on-pink mx-auto rounded-md bg-pine px-6 py-2.5 text-sm font-semibold tracking-wide text-white no-underline uppercase">
            Abrir a gestão
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted underline">
              Sair
            </button>
          </form>
        </div>
      </AccessCard>
    );
  }

  if (access.status === "unassigned") {
    return (
      <AccessCard>
        <div className="grid w-full gap-4 text-center">
          <h1 className="text-xl font-semibold text-ink underline decoration-2 underline-offset-4">Entrar</h1>
          <p role="alert" className="text-sm text-clay">
            Esta conta não possui papel institucional. O acesso não foi aberto.
          </p>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted underline">
              Sair
            </button>
          </form>
        </div>
      </AccessCard>
    );
  }

  return (
    <AccessCard>
      {(await stateAdminExists()) ? <LoginForm /> : <BootstrapAdminForm />}
    </AccessCard>
  );
}

function ClosedEntry({
  status,
}: {
  status: ReturnType<typeof adminRuntimeStatus>;
}) {
  const items = [
    ["URL pública da base", status.publicUrl],
    ["Chave anônima", status.anonKey],
    ["Chave de serviço no servidor", status.serviceRole],
    ["Segredo de hash da credencial", status.participationPepper],
  ] as const;

  return (
    <>
      <PageHeader
        kicker="Gestores"
        title="O acesso administrativo depende da base institucional."
        lede="Não há login simulado. Administrador estadual e gestor de órgão entram pelo Supabase Auth, com papel e vínculo verificados no servidor."
      />
      <div className="h-1 bg-[#d12d6c]" />
      <section className="bg-[#fff7f9]">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="text-xl text-pine-deep">Situação da base</h2>
          <p className="mt-2 text-base leading-7 text-[#3f3f3f]">
            Estes quatro itens precisam existir no servidor. Enquanto algum estiver ausente, a entrada administrativa não
            abre.
          </p>
          <ul className="mt-8 grid gap-3">
            {items.map(([label, ready]) => (
              <li key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4">
                <span className="text-base text-ink">{label}</span>
                <span
                  className={
                    ready
                      ? "shrink-0 rounded-full bg-[#e8f5e9] px-3 py-1 text-sm font-semibold text-[#15803d]"
                      : "shrink-0 rounded-full bg-[#fde7f0] px-3 py-1 text-sm font-semibold text-pine-deep"
                  }
                >
                  {ready ? "Configurado" : "Ausente"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
