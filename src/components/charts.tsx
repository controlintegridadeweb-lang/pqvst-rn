"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { canDrawHistory } from "@/domain/dashboards/view-model";

export function AxisComparisonChart({
  axes,
}: {
  axes: { code: string; name: string; mean: number | null }[];
}) {
  if (axes.length === 0) {
    return <p className="text-sm text-[#8a7380]">As médias aparecem depois da autorização.</p>;
  }

  return (
    <ul className="space-y-4">
      {axes.map((axis) => {
        const placed = axis.mean !== null;
        const ratio = placed ? ((axis.mean as number) - 1) / 4 : 0;
        const width = Math.min(100, Math.max(0, ratio * 100));
        const value = placed
          ? (axis.mean as number).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : "–";

        return (
          <li key={axis.code} className="grid grid-cols-[2rem_1fr] items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fde7f0] text-[11px] font-semibold text-[#a41f52]">
              {axis.code.replace("E", "")}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm leading-5 text-[#2c2428]">{axis.name}</p>
                {placed ? <span className="shrink-0 text-sm font-semibold text-[#241820] tabular-nums">{value}</span> : null}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f6e8ee]">
                {placed ? <div className="h-full rounded-full bg-[#d12d6c]" style={{ width: `${width}%` }} /> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function HistoryChart({
  points,
}: {
  points: { cycle: string; iqvst: number; comparable: boolean }[];
}) {
  if (!canDrawHistory(points)) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl bg-[#fbf7f8] px-6 py-10 text-center">
        <p className="text-sm font-medium text-[#3f2c34]">Série ainda sem ciclos comparáveis</p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#8a7380]">
          A evolução entra quando dois ciclos usam a mesma metodologia.
        </p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="iqvst-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d12d6c" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#d12d6c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3e6ec" vertical={false} />
          <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: "#8a7380" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: "#8a7380" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number"
                ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : String(value ?? ""),
              "IQVST",
            ]}
          />
          <Area type="monotone" dataKey="iqvst" stroke="#d12d6c" strokeWidth={2} fill="url(#iqvst-area)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
