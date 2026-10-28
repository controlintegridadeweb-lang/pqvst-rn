"use client";

import { Dashboard } from "@/app/transparencia/dashboard-view";
import { usePublicDashboard } from "@/app/transparencia/use-public-dashboard";
import type { DashboardCatalog } from "@/domain/dashboards/from-snapshots";

export function LiveDashboard({ initial }: { initial: DashboardCatalog }) {
  const catalog = usePublicDashboard(initial);
  return <Dashboard model={catalog.fallback} editions={catalog.editions} />;
}
