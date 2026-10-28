import "server-only";

import { admitParticipation, todayInRioGrandeDoNorte } from "@/domain/privacy/issuance";
import { findCredentialById } from "@/infrastructure/participation/collection";
import { readPassCredentialId } from "@/infrastructure/participation/pass";

export async function readValidParticipation(): Promise<{ credentialId: string } | null> {
  const credentialId = await readPassCredentialId();
  if (!credentialId) return null;
  const stored = await findCredentialById(credentialId);
  if (!stored) return null;
  const admitted = admitParticipation({
    credentialStatus: stored.status,
    cycleStatus: stored.cycleStatus,
    opensOn: stored.opensOn,
    closesOn: stored.closesOn,
    today: todayInRioGrandeDoNorte(),
  });
  return admitted.ok ? { credentialId } : null;
}
