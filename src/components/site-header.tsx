import Link from "next/link";

const LINKS = [
  ["Início", "/"],
  ["O programa", "/programa"],
  ["Metodologia", "/metodologia"],
  ["Transparência", "/transparencia"],
  ["Ações", "/acoes"],
  ["Privacidade", "/privacidade"],
] as const;

export function SiteHeader() {
  return (
    <header className="no-print bg-[#c2185b] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide text-white uppercase no-underline">
          PQVST
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-white no-underline hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
