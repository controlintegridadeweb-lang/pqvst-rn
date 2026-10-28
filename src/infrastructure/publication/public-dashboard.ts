import "server-only";

import { createClient } from "@supabase/supabase-js";
import { dashboardFromSnapshots, type PublicSnapshotRow } from "@/domain/dashboards/from-snapshots";
import { emptyDashboard, type DashboardModel } from "@/domain/dashboards/view-model";

export async function readPublicDashboard(): Promise<DashboardModel> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return emptyDashboard("database_not_configured");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("aggregate_snapshots")
    .select(
      "publication_id, cycle_id, cycle_name, organization_id, organization_name, axis_code, metric, value, response_count, classification, methodology_id, created_at",
    )
    .eq("suppressed", false)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error || !data) return emptyDashboard("publication_source_not_connected");
  return dashboardFromSnapshots(data.map(snapshotRow));
}

function snapshotRow(row: {
  publication_id: string;
  cycle_id: string;
  cycle_name: string;
  organization_id: string | null;
  organization_name: string | null;
  axis_code: string | null;
  metric: string;
  value: string | number | null;
  response_count: number | null;
  classification: string | null;
  methodology_id: string;
  created_at: string;
}): PublicSnapshotRow {
  return {
    publicationId: row.publication_id,
    cycleId: row.cycle_id,
    cycleName: row.cycle_name,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    axisCode: row.axis_code,
    metric: row.metric,
    value: row.value,
    responseCount: row.response_count,
    classification: row.classification,
    methodologyId: row.methodology_id,
    createdAt: row.created_at,
  };
}
