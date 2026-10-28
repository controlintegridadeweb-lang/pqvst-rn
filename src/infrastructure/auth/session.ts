import "server-only";
import { connection } from "next/server";
import type { Actor, AppRole } from "@/domain/access/permissions";
import { createAuthClient } from "@/infrastructure/supabase/server";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface InstitutionalSession {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  organizationIds: readonly string[];
}

export type InstitutionalAccess =
  | { status: "anonymous" }
  | { status: "unassigned" }
  | { status: "ready"; session: InstitutionalSession };

export type SessionActor = Exclude<Actor, { kind: "anonymous" }>;

export function actorFromSession(session: InstitutionalSession): SessionActor {
  if (session.role === "state_admin") {
    return { kind: "state_admin", userId: session.userId };
  }
  return { kind: "org_manager", userId: session.userId, organizationIds: session.organizationIds };
}

function isAppRole(value: unknown): value is AppRole {
  return value === "state_admin" || value === "org_manager";
}

export async function readInstitutionalAccess(): Promise<InstitutionalAccess> {
  await connection();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { status: "anonymous" };
  }
  return readAccess(await createAuthClient());
}

export async function readAccess(supabase: AuthClient): Promise<InstitutionalAccess> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { status: "anonymous" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile || !isAppRole(profile.role)) {
    return { status: "unassigned" };
  }

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", data.user.id)
    .eq("status", "active");

  return {
    status: "ready",
    session: {
      userId: data.user.id,
      email: data.user.email ?? "",
      fullName: profile.full_name,
      role: profile.role,
      organizationIds: (memberships ?? []).map((row) => String(row.organization_id)),
    },
  };
}
