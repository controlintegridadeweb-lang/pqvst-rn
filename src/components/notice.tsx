import type { ReactNode } from "react";

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl bg-[#fde7f0] px-5 py-4 text-ink ring-1 ring-[#f3e4ea]" role="status">
      <h2 className="text-lg text-pine-deep">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-6 text-[#3f3f3f]">{children}</div>
    </aside>
  );
}
