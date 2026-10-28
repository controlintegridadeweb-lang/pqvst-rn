import Link from "next/link";

const NAVIGATION = [
  ["Início", "/"],
  ["O programa", "/programa"],
  ["Metodologia", "/metodologia"],
  ["Transparência", "/transparencia"],
] as const;

const SUPPORT = [
  ["Privacidade", "/privacidade"],
  ["Ações de melhoria", "/acoes"],
  ["Acesso de gestores", "/acesso"],
  ["Relatórios", "/relatorios"],
] as const;

export function SiteFooter() {
  return (
    <footer className="no-print bg-[#c2185b] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold tracking-wide">PQVST</p>
          <p className="mt-3 text-sm leading-6 text-white">
            Programa Estadual de Qualidade de Vida e Saúde no Trabalho.
          </p>
          <p className="mt-3 text-sm leading-6 text-white">CONTROL/RN · PIC/RN</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">Navegação</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NAVIGATION.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-white no-underline hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">Apoio</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SUPPORT.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-white no-underline hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">Participar</h2>
          <p className="mt-4 text-sm leading-6 text-white">Acesse o diagnóstico do seu órgão com a credencial de participação.</p>
          <Link
            href="/diagnostico"
            className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#c2185b] no-underline"
          >
            Entrar
          </Link>
        </div>
      </div>
      <div className="border-t border-white/25">
        <p className="mx-auto max-w-6xl px-5 py-4 text-center text-sm text-white">
          © 2026 PQVST. Todos os direitos autorais reservados.
        </p>
      </div>
    </footer>
  );
}
