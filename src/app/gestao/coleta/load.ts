import "server-only";

import { actorFromSession, readInstitutionalAccess } from "@/infrastructure/auth/session";
import { loadParticipationDesk, type ParticipationDesk } from "@/infrastructure/participation/collection";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export type DeskAccess =
  | { status: "closed" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; canManage: boolean; desk: ParticipationDesk };

export async function readDeskAccess(): Promise<DeskAccess> {
  if (!isAdminEntryOpen()) return { status: "closed" };
  const access = await readInstitutionalAccess();
  if (access.status !== "ready") return { status: "signed-out" };
  const actor = actorFromSession(access.session);
  const desk = await loadParticipationDesk(actor.kind === "state_admin" ? "all" : actor.organizationIds);
  if (!desk.ok) return { status: "error", message: desk.error.message };
  return { status: "ready", canManage: actor.kind === "state_admin", desk: desk.value };
}
