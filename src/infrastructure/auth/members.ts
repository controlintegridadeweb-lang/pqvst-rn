import "server-only";

import { MEMBER_SEATS, type MemberAccount, type MemberSeat } from "@/domain/access/member";
import { fail, ok, type DomainResult } from "@/domain/shared/result";
import { createServiceClient } from "@/infrastructure/supabase/admin";

export interface MemberRecord {
  id: string;
  fullName: string;
  seat: MemberSeat;
  status: "active" | "inactive";
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
}

const READ_ERROR = "A base institucional não pôde ser consultada.";
const WRITE_ERROR = "Não foi possível gravar o vínculo do membro.";

function clientOrNull() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServiceClient();
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function isSeat(value: string): value is MemberSeat {
  return MEMBER_SEATS.includes(value as MemberSeat);
}

function readStatus(value: string | null): "active" | "inactive" | null {
  if (value === "active" || value === "inactive") return value;
  return null;
}

export async function listMembers(scope: "all" | readonly string[]): Promise<DomainResult<MemberRecord[]>> {
  if (scope !== "all" && scope.length === 0) return ok([]);
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  let query = client
    .from("organization_memberships")
    .select("id, seat, status, organization_id, user_profiles(full_name), organizations(name, acronym)")
    .order("created_at", { ascending: false });
  if (scope !== "all") query = query.in("organization_id", [...scope]);
  const { data, error } = await query;
  if (error) return fail("persistence_failed", READ_ERROR);
  const members = (data ?? []).flatMap((row) => {
    const id = text(row.id);
    const seat = text(row.seat);
    const membershipStatus = readStatus(text(row.status));
    const organizationId = text(row.organization_id);
    const profile = asRecord(row.user_profiles);
    const organization = asRecord(row.organizations);
    const fullName = text(profile?.full_name);
    const organizationName = text(organization?.name);
    const organizationAcronym = text(organization?.acronym);
    if (!id || !seat || !isSeat(seat) || !membershipStatus) return [];
    if (!organizationId || !fullName || !organizationName || !organizationAcronym) return [];
    return [{ id, fullName, seat, status: membershipStatus, organizationId, organizationName, organizationAcronym }];
  });
  return ok(members);
}

export async function createMemberAccount(account: MemberAccount): Promise<DomainResult<{ membershipId: string }>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);

  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .select("id")
    .eq("id", account.organizationId)
    .eq("participation", "active")
    .maybeSingle();
  if (organizationError) return fail("persistence_failed", READ_ERROR);
  if (!organization) return fail("organization_missing", "O órgão escolhido não está ativo nesta instalação.");

  const { data, error } = await client.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });
  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return fail("email_in_use", "Este e-mail já está em uso.");
    }
    return fail("member_failed", WRITE_ERROR);
  }

  const userId = data.user.id;
  const { error: profileError } = await client.from("user_profiles").insert({
    id: userId,
    full_name: account.fullName,
    role: "org_manager",
  });
  if (profileError) {
    await client.auth.admin.deleteUser(userId);
    return fail("member_failed", WRITE_ERROR);
  }

  const { data: membership, error: membershipError } = await client
    .from("organization_memberships")
    .insert({
      user_id: userId,
      organization_id: account.organizationId,
      seat: account.seat,
      status: "active",
    })
    .select("id")
    .single();
  const membershipId = text(asRecord(membership)?.id);
  if (membershipError || !membershipId) {
    await client.auth.admin.deleteUser(userId);
    return fail("member_failed", WRITE_ERROR);
  }
  return ok({ membershipId });
}
