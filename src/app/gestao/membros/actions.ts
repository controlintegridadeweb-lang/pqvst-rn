"use server";

import { revalidatePath } from "next/cache";
import { parseMemberAccount } from "@/domain/access/member";
import { authorize } from "@/domain/access/permissions";
import { actorFromSession, readInstitutionalAccess } from "@/infrastructure/auth/session";
import { createMemberAccount } from "@/infrastructure/auth/members";
import { recordAudit } from "@/infrastructure/audit/log";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";

export interface FormState {
  error: string | null;
  notice: string | null;
}

export async function createMember(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isAdminEntryOpen()) return { error: "A base institucional ainda não está configurada.", notice: null };
  const access = await readInstitutionalAccess();
  if (access.status !== "ready") return { error: "Entre com um papel institucional para vincular um membro.", notice: null };
  const actor = actorFromSession(access.session);
  const allowed = authorize(actor, { action: "manage_members" });
  if (!allowed.ok) return { error: allowed.error.message, notice: null };

  const parsed = parseMemberAccount({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
    organizationId: String(formData.get("organizationId") ?? ""),
    seat: String(formData.get("seat") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error.message, notice: null };

  const created = await createMemberAccount(parsed.value);
  if (!created.ok) return { error: created.error.message, notice: null };
  await recordAudit({
    actorId: actor.userId,
    action: "member_created",
    entity: "organization_memberships",
    entityId: created.value.membershipId,
    metadata: { seat: parsed.value.seat, organizationId: parsed.value.organizationId },
  });
  revalidatePath("/gestao/membros");
  revalidatePath("/gestao");
  return { error: null, notice: "Membro vinculado. A pessoa entra em Acesso de gestores com este e-mail." };
}
