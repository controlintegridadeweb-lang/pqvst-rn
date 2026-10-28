import "server-only";

import { redirect } from "next/navigation";
import { readValidParticipation } from "@/infrastructure/participation/gate";

export async function requireParticipation() {
  const pass = await readValidParticipation();
  if (!pass) redirect("/diagnostico");
}
