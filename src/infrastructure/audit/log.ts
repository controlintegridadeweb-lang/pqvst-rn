import "server-only";

import { fail, ok, type DomainResult } from "@/domain/shared/result";
import { createServiceClient } from "@/infrastructure/supabase/admin";

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
}

const READ_ERROR = "A trilha administrativa não pôde ser consultada.";

function clientOrNull() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServiceClient();
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function recordAudit(entry: {
  actorId: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> {
  const client = clientOrNull();
  if (!client) return;
  await client.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    metadata: entry.metadata ?? {},
  });
}

export async function listAuditEntries(): Promise<DomainResult<AuditEntry[]>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { data, error } = await client
    .from("audit_logs")
    .select("id, action, entity, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return fail("persistence_failed", READ_ERROR);
  const entries = (data ?? []).flatMap((row) => {
    const id = text(row.id);
    const action = text(row.action);
    const entity = text(row.entity);
    const createdAt = text(row.created_at);
    if (!id || !action || !entity || !createdAt) return [];
    return [{ id, action, entity, createdAt }];
  });
  return ok(entries);
}
