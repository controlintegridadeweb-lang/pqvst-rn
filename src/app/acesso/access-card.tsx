import type { ReactNode } from "react";
import Link from "next/link";

export function AccessCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] md:min-h-[520px] md:grid-cols-2">
      <div className="flex items-center px-8 py-12 sm:px-12">{children}</div>
      <WelcomePanel />
    </div>
  );
}

function WelcomePanel() {
  return (
    <aside className="flex min-h-80 items-center justify-center bg-[#c2185b] px-8 py-14 text-center text-white">
      <div className="max-w-xs">
        <h2 className="text-2xl font-semibold tracking-[0.16em]">BEM-VINDO!</h2>
        <p className="mt-4 text-sm leading-6 text-white">
          Entre com a conta institucional e acompanhe a gestão do programa.
        </p>
        <Link
          href="/"
          className="on-pink mt-8 inline-flex rounded-md border border-white px-8 py-2 text-xs font-semibold tracking-[0.18em] text-white no-underline hover:bg-white/10"
        >
          INÍCIO
        </Link>
      </div>
    </aside>
  );
}
