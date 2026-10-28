"use client";

import { Dashboard } from "@/app/transparencia/dashboard-view";
import { usePublicDashboard } from "@/app/transparencia/use-public-dashboard";
import type { DashboardModel } from "@/domain/dashboards/view-model";

export function LiveDashboard({ initial }: { initial: DashboardModel }) {
  const model = usePublicDashboard(initial);
  return <Dashboard model={model} />;
}
