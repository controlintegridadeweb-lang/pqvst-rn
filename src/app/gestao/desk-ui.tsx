import Link from "next/link";
import type { ReactNode } from "react";
import { CYCLE_STATE_LABELS, type CycleState } from "@/domain/cycles/cycle";

const STATUS_PILL: Record<CycleState, string> = {
  draft: "bg-[#fff4d6] text-[#a16207]",
  scheduled: "bg-[#efe7ff] text-[#7c3aed]",
  open: "bg-[#fde7f0] text-[#c2185b]",
  closed: "bg-[#f3f4f6] text-[#6b7280]",
  processed: "bg-[#efe7ff] text-[#7c3aed]",
  published: "bg-[#e8f5e9] text-[#15803d]",
};

const AVATAR = [
  "bg-[#fde7f0] text-[#c2185b]",
  "bg-[#efe7ff] text-[#7c3aed]",
  "bg-[#fff4d6] text-[#a16207]",
  "bg-[#e8eefc] text-[#1d4ed8]",
];

export type StatIconName = "building" | "cycle" | "key" | "check" | "people" | "list" | "plan" | "shield";

export const deskButton =
  "on-pink w-fit rounded-full bg-[#c2185b] px-4 py-2.5 text-sm font-semibold text-white no-underline disabled:opacity-60";

export const deskField =
  "w-full rounded-xl border border-[#e6e7eb] bg-[#f5f6f8] px-3 py-2.5 text-sm font-normal text-ink";

export function DeskPage({ notice, children }: { notice?: string | null; children?: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] px-4 py-6 md:px-6 md:py-8">
      {notice ? <p className="mb-5 max-w-3xl text-sm leading-6 text-[#3f3f3f]">{notice}</p> : null}
      {children}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function DeskColumns({ children }: { children: ReactNode }) {
  return <div className="mt-5 grid items-start gap-4 lg:grid-cols-3">{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  tone = "plain",
  href,
}: {
  label: string;
  value: number | null;
  icon: StatIconName;
  tone?: "plain" | "pink";
  href?: string;
}) {
  const pink = tone === "pink";
  const className = pink
    ? "flex items-center justify-between rounded-2xl bg-[#c2185b] px-5 py-5 text-white no-underline shadow-[0_10px_30px_rgba(194,24,91,0.22)]"
    : "flex items-center justify-between rounded-2xl bg-white px-5 py-5 text-ink no-underline shadow-[0_10px_30px_rgba(23,23,23,0.05)]";
  const body = (
    <>
      <span>
        <span className={`block text-3xl font-semibold tracking-tight ${pink ? "text-white" : "text-ink"}`}>
          {value === null ? "–" : value.toLocaleString("pt-BR")}
        </span>
        <span className={`mt-1 block text-sm ${pink ? "text-white" : "text-[#8a8a96]"}`}>{label}</span>
      </span>
      <StatIcon name={icon} className={pink ? "text-white" : "text-[#6d5efc]"} />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

export function Panel({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,23,23,0.05)] ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action ? (
          <Link href={action.href} className={`${deskButton} shrink-0 px-3.5 py-1.5 text-xs`}>
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function CycleStatus({ status }: { status: CycleState }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_PILL[status]}`}>
      {CYCLE_STATE_LABELS[status]}
    </span>
  );
}

export function Mark({ label, index }: { label: string; index: number }) {
  const text = label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "–";
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold ${AVATAR[index % AVATAR.length]}`}>
      {text}
    </span>
  );
}

export function formatIsoDate(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function participationLabel(count: number) {
  return count === 1 ? "1 órgão" : `${count.toLocaleString("pt-BR")} órgãos`;
}

export const shell = "min-h-[calc(100vh-4.5rem)] bg-[#eef1f8] px-4 py-6 md:px-7 md:py-8";
export const shellCard = "rounded-[1.6rem] bg-white shadow-[0_8px_24px_rgba(70,60,120,0.05)]";
export const shellButton =
  "on-pink inline-flex w-fit items-center justify-center rounded-full bg-[#6d5efc] px-5 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-[0_8px_18px_rgba(109,94,252,0.28)] disabled:opacity-60";
export const shellField =
  "w-full rounded-2xl border border-transparent bg-[#f7f6fd] px-4 py-2.5 text-sm font-normal text-[#2c2a4a] outline-none focus:border-[#d9d4f5]";

export function ShellPage({
  kicker,
  title,
  notice,
  children,
}: {
  kicker: string;
  title: string;
  notice: string;
  children: ReactNode;
}) {
  return (
    <div className={shell}>
      <header className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#6d5efc] uppercase">{kicker}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#2c2a4a]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#7a7b90]">{notice}</p>
      </header>
      {children}
    </div>
  );
}

export function ShellTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8b8ca3] uppercase">{kicker}</p>
      <h2 className="mt-0.5 text-lg font-semibold text-[#2c2a4a]">{title}</h2>
    </div>
  );
}

export function ShellMetric({
  label,
  value,
  icon,
  tone = "plain",
}: {
  label: string;
  value: number | null;
  icon: StatIconName;
  tone?: "plain" | "accent";
}) {
  const accent = tone === "accent";
  return (
    <article
      className={
        accent
          ? "flex min-h-28 items-center justify-between rounded-[1.6rem] bg-[#6d5efc] px-5 py-5 text-white shadow-[0_10px_24px_rgba(109,94,252,0.22)]"
          : `${shellCard} flex min-h-28 items-center justify-between px-5 py-5`
      }
    >
      <span>
        <span className={`block text-3xl font-semibold tracking-tight tabular-nums ${accent ? "text-white" : "text-[#2c2a4a]"}`}>
          {value === null ? "–" : value.toLocaleString("pt-BR")}
        </span>
        <span className={`mt-1 block text-sm ${accent ? "text-white/85" : "text-[#7a7b90]"}`}>{label}</span>
      </span>
      <span className={`grid size-11 place-items-center rounded-2xl ${accent ? "bg-white/15 text-white" : "bg-[#efeaff] text-[#6d5efc]"}`}>
        <StatIcon name={icon} className={accent ? "text-white" : "text-[#6d5efc]"} compact />
      </span>
    </article>
  );
}

export function shellNote(tone: "ok" | "error" | "muted") {
  if (tone === "ok") return "rounded-2xl bg-[#e8f5e9] px-4 py-3 text-sm leading-6 text-[#166534]";
  if (tone === "error") return "rounded-2xl bg-[#fde7f0] px-4 py-3 text-sm leading-6 text-[#9f1239]";
  return "rounded-2xl bg-[#f7f6fd] px-4 py-6 text-sm leading-6 text-[#7a7b90]";
}

function StatIcon({ name, className, compact = false }: { name: StatIconName; className: string; compact?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`${compact ? "size-5" : "size-7"} shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {name === "building" ? (
        <>
          <path d="M4 20h16M6 20V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V20" />
          <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01" strokeLinecap="round" />
        </>
      ) : null}
      {name === "cycle" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 2" strokeLinecap="round" />
        </>
      ) : null}
      {name === "key" ? (
        <>
          <circle cx="8" cy="14" r="4" />
          <path d="M11.5 12.5 20 4m0 0h-3.5M20 4v3.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {name === "check" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {name === "people" ? (
        <path
          d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12zM3.5 19a4.5 4.5 0 0 1 9 0m1.2-1.2a4.2 4.2 0 0 1 7.3 1.2"
          strokeLinecap="round"
        />
      ) : null}
      {name === "list" ? <path d="M8 7h11M8 12h11M8 17h11M5 7h.01M5 12h.01M5 17h.01" strokeLinecap="round" /> : null}
      {name === "plan" ? (
        <>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
          <path d="M9 9h6M9 13h4" strokeLinecap="round" />
        </>
      ) : null}
      {name === "shield" ? (
        <>
          <path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  );
}
