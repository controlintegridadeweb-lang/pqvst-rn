import { Suspense } from "react";
import { connection } from "next/server";
import { OrganizationsLive } from "@/app/transparencia/orgaos/organizations-view";
import { emptyCatalog } from "@/domain/dashboards/from-snapshots";
import { readPublicDashboard } from "@/infrastructure/publication/public-dashboard";

export const metadata = { title: "Órgãos" };

export default function OrganizationsTransparencyPage() {
  return (
    <Suspense fallback={<OrganizationsLive initial={emptyCatalog("no_publication")} />}>
      <PublishedOrganizations />
    </Suspense>
  );
}

async function PublishedOrganizations() {
  await connection();
  const model = await readPublicDashboard();
  return <OrganizationsLive initial={model} />;
}
