import { AXIS_CODES, OFFICIAL_AXES, type AxisCode } from "@/domain/indicators/axes";
import type { PublicationStatus } from "@/domain/privacy/disclosure";

export interface DashboardAxis {
  code: AxisCode;
  name: string;
  description: string;
  meanLabel: string | null;
  mean: number | null;
  status: PublicationStatus;
}

export interface DashboardOrganization {
  id: string;
  name: string;
  iqvstLabel: string | null;
}

export interface DashboardModel {
  availability: "database_not_configured" | "publication_source_not_connected" | "no_publication" | "published";
  title: string;
  updatedAt: string | null;
  participatingOrganizations: number | null;
  publishedOrganizations: number | null;
  responseCount: number | null;
  iqvstLabel: string | null;
  classificationLabel: string | null;
  participationLabel: string | null;
  axes: DashboardAxis[];
  organizations: DashboardOrganization[];
  history: { cycle: string; iqvst: number; comparable: boolean }[];
  notices: string[];
}

const TITLES = {
  database_not_configured: "Base institucional não conectada",
  publication_source_not_connected: "Leitura dos resultados ainda não ligada",
  no_publication: "Nenhum resultado publicado",
} as const;

export function emptyDashboard(
  availability: keyof typeof TITLES,
): DashboardModel {
  return {
    availability,
    title: TITLES[availability],
    updatedAt: null,
    participatingOrganizations: null,
    publishedOrganizations: null,
    responseCount: null,
    iqvstLabel: null,
    classificationLabel: null,
    participationLabel: null,
    axes: OFFICIAL_AXES.map((axis) => ({
      code: axis.code,
      name: axis.name,
      description: axis.description,
      meanLabel: null,
      mean: null,
      status: "no_data",
    })),
    organizations: [],
    history: [],
    notices: [
      "Ausência de publicação não é indicador zero.",
      "Nenhum gráfico é desenhado sem resultado autorizado.",
    ],
  };
}

export function canDrawHistory(history: DashboardModel["history"]): boolean {
  return history.length >= 2 && history.every((point) => point.comparable);
}

export function publishedAxisChartData(model: DashboardModel): { name: string; mean: number }[] {
  if (model.availability !== "published") return [];
  return model.axes
    .filter((axis) => axis.status === "published" && axis.mean !== null)
    .map((axis) => ({ name: axis.code, mean: axis.mean as number }));
}

export function assertSixAxes(model: DashboardModel): boolean {
  return AXIS_CODES.every((code) => model.axes.some((axis) => axis.code === code));
}
