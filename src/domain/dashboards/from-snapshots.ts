import { OFFICIAL_AXES } from "@/domain/indicators/axes";
import { CLASSIFICATION_CODES, classificationLabel, classifyIqvst, type ClassificationCode } from "@/domain/indicators/classification";
import { Decimal } from "@/domain/shared/decimal";
import { emptyDashboard, type DashboardModel, type DashboardOrganization } from "@/domain/dashboards/view-model";

export interface PublicSnapshotRow {
  publicationId: string;
  cycleId: string;
  cycleName: string;
  organizationId: string | null;
  organizationName: string | null;
  axisCode: string | null;
  metric: string;
  value: string | number | null;
  responseCount: number | null;
  classification: string | null;
  methodologyId: string;
  createdAt: string;
}

export interface DashboardEdition {
  year: string;
  cycleName: string;
  model: DashboardModel;
}

export interface DashboardCatalog {
  editions: DashboardEdition[];
  fallback: DashboardModel;
}

export function emptyCatalog(availability: Exclude<DashboardModel["availability"], "published">): DashboardCatalog {
  return { editions: [], fallback: emptyDashboard(availability) };
}

export function periodYear(row: PublicSnapshotRow): string {
  const named = row.cycleName.match(/\b(?:19|20)\d{2}\b/);
  if (named) return named[0];
  const date = new Date(row.createdAt);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Fortaleza", year: "numeric" }).format(date);
  }
  const label = row.cycleName.trim();
  return label || "Sem período";
}

export function dashboardCatalog(rows: readonly PublicSnapshotRow[]): DashboardCatalog {
  if (rows.length === 0) return emptyCatalog("no_publication");
  const years = [...new Set(rows.map(periodYear))].sort(comparePeriods);
  const editions = years.flatMap((year) => {
    const model = dashboardFromSnapshots(rows, year);
    if (model.availability !== "published") return [];
    return [{ year, cycleName: model.title, model }];
  });
  if (editions.length === 0) return emptyCatalog("no_publication");
  return { editions, fallback: editions[0].model };
}

export function dashboardFromSnapshots(rows: readonly PublicSnapshotRow[], year?: string): DashboardModel {
  const scoped = year ? rows.filter((row) => periodYear(row) === year) : rows;
  if (scoped.length === 0) return emptyDashboard("no_publication");

  const current = scoped.reduce((latest, row) => (row.createdAt > latest.createdAt ? row : latest));
  const publication = scoped.filter((row) => row.publicationId === current.publicationId);
  const statewide = publication.filter((row) => row.organizationId === null);
  const iqvst = decimalOf(statewide.find((row) => row.metric === "iqvst" && row.axisCode === null)?.value ?? null);
  const axes = OFFICIAL_AXES.map((axis) => {
    const row = statewide.find((item) => item.metric === "axis_mean" && item.axisCode === axis.code);
    const mean = decimalOf(row?.value ?? null);
    return {
      code: axis.code,
      name: axis.name,
      description: axis.description,
      meanLabel: mean ? mean.formatPtBr(2) : null,
      mean: mean ? Number(mean.toFixed(2)) : null,
      status: mean ? ("published" as const) : ("no_data" as const),
    };
  });
  const organizations = organizationsOf(publication);
  const published = iqvst !== null || axes.some((axis) => axis.mean !== null) || organizations.length > 0;
  if (!published) return emptyDashboard("no_publication");

  const countRow = statewide.find((row) => row.metric === "response_count" && row.axisCode === null);
  const responseCount = whole(countRow?.responseCount ?? countRow?.value ?? null);

  return {
    availability: "published",
    title: current.cycleName,
    updatedAt: formatMoment(current.createdAt),
    participatingOrganizations: null,
    publishedOrganizations: organizations.length > 0 ? organizations.length : null,
    responseCount,
    iqvstLabel: iqvst ? iqvst.formatPtBr(2) : null,
    classificationLabel: bandLabel(
      statewide.find((row) => row.metric === "iqvst" && row.axisCode === null)?.classification ?? null,
      iqvst,
    ),
    participationLabel: null,
    axes,
    organizations,
    history: historyOf(rows, current.methodologyId),
    notices: [
      "Os números saem da publicação vigente e mudam quando uma nova fotografia é autorizada.",
      "Ausência de um eixo não é indicador zero.",
    ],
  };
}

function organizationsOf(rows: readonly PublicSnapshotRow[]): DashboardOrganization[] {
  const byId = new Map<string, DashboardOrganization>();
  for (const row of rows) {
    if (!row.organizationId || !row.organizationName || row.metric !== "iqvst" || row.axisCode !== null) continue;
    const mean = decimalOf(row.value);
    byId.set(row.organizationId, {
      id: row.organizationId,
      name: row.organizationName,
      iqvstLabel: mean ? mean.formatPtBr(2) : null,
    });
  }
  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

function historyOf(rows: readonly PublicSnapshotRow[], methodologyId: string) {
  const latest = new Map<string, PublicSnapshotRow>();
  for (const row of rows) {
    if (row.organizationId !== null || row.metric !== "iqvst" || row.axisCode !== null) continue;
    const previous = latest.get(row.cycleId);
    if (!previous || row.createdAt > previous.createdAt) latest.set(row.cycleId, row);
  }
  return [...latest.values()]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .flatMap((row) => {
      const mean = decimalOf(row.value);
      if (!mean) return [];
      return [{ cycle: row.cycleName, iqvst: Number(mean.toFixed(2)), comparable: row.methodologyId === methodologyId }];
    });
}

function decimalOf(value: string | number | null): Decimal | null {
  if (value === null) return null;
  const text = typeof value === "number" ? value.toFixed(4) : value.trim();
  try {
    return Decimal.fromString(text);
  } catch {
    return null;
  }
}

function whole(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function bandLabel(stored: string | null, value: Decimal | null): string | null {
  if (stored && CLASSIFICATION_CODES.includes(stored as ClassificationCode)) {
    return classificationLabel(stored as ClassificationCode);
  }
  if (!value) return null;
  try {
    return classificationLabel(classifyIqvst(value));
  } catch {
    return null;
  }
}

function comparePeriods(left: string, right: string) {
  const leftYear = Number(left);
  const rightYear = Number(right);
  if (Number.isInteger(leftYear) && Number.isInteger(rightYear)) return rightYear - leftYear;
  return right.localeCompare(left, "pt-BR");
}

function formatMoment(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(date);
}
