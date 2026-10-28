import { Suspense } from "react";
import { connection } from "next/server";
import { Dashboard } from "@/app/transparencia/dashboard-view";
import { LiveDashboard } from "@/app/transparencia/live-dashboard";
import { emptyDashboard } from "@/domain/dashboards/view-model";
import { readPublicDashboard } from "@/infrastructure/publication/public-dashboard";

export const metadata = { title: "Transparência" };

export default function TransparencyPage() {
  return (
    <Suspense fallback={<Dashboard model={emptyDashboard("no_publication")} />}>
      <PublishedDashboard />
    </Suspense>
  );
}

async function PublishedDashboard() {
  await connection();
  const model = await readPublicDashboard();
  return <LiveDashboard initial={model} />;
}
