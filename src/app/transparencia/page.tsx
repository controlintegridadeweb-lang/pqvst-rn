import { Suspense } from "react";
import { connection } from "next/server";
import { Dashboard } from "@/app/transparencia/dashboard-view";
import { LiveDashboard } from "@/app/transparencia/live-dashboard";
import { emptyCatalog } from "@/domain/dashboards/from-snapshots";
import { readPublicDashboard } from "@/infrastructure/publication/public-dashboard";

export const metadata = { title: "Transparência" };

export default function TransparencyPage() {
  return (
    <Suspense fallback={<Dashboard model={emptyCatalog("no_publication").fallback} editions={[]} />}>
      <PublishedDashboard />
    </Suspense>
  );
}

async function PublishedDashboard() {
  await connection();
  const model = await readPublicDashboard();
  return <LiveDashboard initial={model} />;
}
