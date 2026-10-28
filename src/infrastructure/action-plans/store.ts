import "server-only";

import { ACTION_STATUSES, type ActionStatus } from "@/domain/action-plans/action-item";
import { AXIS_CODES, type AxisCode } from "@/domain/indicators/axes";
import { fail, ok, type DomainResult } from "@/domain/shared/result";
import { createServiceClient } from "@/infrastructure/supabase/admin";

export interface StoredAction {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  cycleId: string;
  cycleName: string;
  axis: AxisCode;
  description: string;
  institutionalOwner: string;
  dueDate: string;
  status: ActionStatus;
  publicDisclosure: boolean;
}

export interface DisclosedAction {
  id: string;
  organizationName: string;
  organizationAcronym: string;
  cycleName: string;
  axis: AxisCode;
  description: string;
  status: ActionStatus;
  dueDate: string;
}

const READ_ERROR = "A base institucional não pôde ser consultada.";
const WRITE_ERROR = "Não foi possível gravar a ação.";

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

function isAxis(value: string): value is AxisCode {
  return AXIS_CODES.includes(value as AxisCode);
}

function isStatus(value: string): value is ActionStatus {
  return ACTION_STATUSES.includes(value as ActionStatus);
}

const ACTION_SELECT =
  "id, organization_id, cycle_id, axis_code, description, institutional_owner, due_date, status, public_disclosure, organizations(name, acronym), survey_cycles(name)";

function readAction(row: Record<string, unknown>): StoredAction | null {
  const id = text(row.id);
  const organizationId = text(row.organization_id);
  const cycleId = text(row.cycle_id);
  const axis = text(row.axis_code);
  const description = text(row.description);
  const institutionalOwner = text(row.institutional_owner);
  const dueDate = text(row.due_date);
  const status = text(row.status);
  const organization = asRecord(row.organizations);
  const cycle = asRecord(row.survey_cycles);
  const organizationName = text(organization?.name);
  const organizationAcronym = text(organization?.acronym);
  const cycleName = text(cycle?.name);
  if (!id || !organizationId || !cycleId || !axis || !isAxis(axis) || !description || !institutionalOwner || !dueDate) return null;
  if (!status || !isStatus(status) || !organizationName || !organizationAcronym || !cycleName) return null;
  return {
    id,
    organizationId,
    organizationName,
    organizationAcronym,
    cycleId,
    cycleName,
    axis,
    description,
    institutionalOwner,
    dueDate: dueDate.slice(0, 10),
    status,
    publicDisclosure: row.public_disclosure === true,
  };
}

export async function listActions(scope: "all" | readonly string[]): Promise<DomainResult<StoredAction[]>> {
  if (scope !== "all" && scope.length === 0) return ok([]);
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  let query = client.from("action_items").select(ACTION_SELECT).order("created_at", { ascending: false });
  if (scope !== "all") query = query.in("organization_id", [...scope]);
  const { data, error } = await query;
  if (error) return fail("persistence_failed", READ_ERROR);
  return ok((data ?? []).flatMap((row) => {
    const action = readAction(row);
    return action ? [action] : [];
  }));
}

export async function listDisclosedActions(): Promise<DomainResult<DisclosedAction[]>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { data, error } = await client
    .from("action_items")
    .select(ACTION_SELECT)
    .eq("public_disclosure", true)
    .order("created_at", { ascending: false });
  if (error) return fail("persistence_failed", READ_ERROR);
  const actions = (data ?? []).flatMap((row) => {
    const action = readAction(row);
    if (!action) return [];
    return [{
      id: action.id,
      organizationName: action.organizationName,
      organizationAcronym: action.organizationAcronym,
      cycleName: action.cycleName,
      axis: action.axis,
      description: action.description,
      status: action.status,
      dueDate: action.dueDate,
    }];
  });
  return ok(actions);
}

export async function saveActionItem(input: {
  organizationId: string;
  cycleId: string;
  cycleName: string;
  axis: AxisCode;
  problem: string;
  objective: string;
  description: string;
  institutionalOwner: string;
  dueDate: string;
  expectedResult: string;
  monitoringIndicator: string | null;
}): Promise<DomainResult<{ id: string }>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);

  const { data: existingPlan, error: planReadError } = await client
    .from("action_plans")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("cycle_id", input.cycleId)
    .maybeSingle();
  if (planReadError) return fail("persistence_failed", WRITE_ERROR);

  let planId = text(asRecord(existingPlan)?.id);
  if (!planId) {
    const { data: createdPlan, error: planError } = await client
      .from("action_plans")
      .insert({
        organization_id: input.organizationId,
        cycle_id: input.cycleId,
        title: `Plano ${input.cycleName}`,
      })
      .select("id")
      .single();
    if (planError) return fail("persistence_failed", WRITE_ERROR);
    planId = text(asRecord(createdPlan)?.id);
  }
  if (!planId) return fail("persistence_failed", WRITE_ERROR);

  const { data: created, error } = await client
    .from("action_items")
    .insert({
      action_plan_id: planId,
      organization_id: input.organizationId,
      cycle_id: input.cycleId,
      axis_code: input.axis,
      problem: input.problem,
      objective: input.objective,
      description: input.description,
      institutional_owner: input.institutionalOwner,
      due_date: input.dueDate,
      expected_result: input.expectedResult,
      monitoring_indicator: input.monitoringIndicator,
      status: "not_started",
      public_disclosure: false,
    })
    .select("id")
    .single();
  const id = text(asRecord(created)?.id);
  if (error || !id) return fail("persistence_failed", WRITE_ERROR);

  const { error: updateError } = await client.from("action_updates").insert({
    action_item_id: id,
    status: "not_started",
    note: "Ação registrada.",
  });
  if (updateError) return fail("persistence_failed", WRITE_ERROR);
  return ok({ id });
}

export async function setActionDisclosure(id: string, disclose: boolean): Promise<DomainResult<true>> {
  const client = clientOrNull();
  if (!client) return fail("database_not_configured", READ_ERROR);
  const { error } = await client.from("action_items").update({ public_disclosure: disclose }).eq("id", id);
  if (error) return fail("persistence_failed", WRITE_ERROR);
  return ok(true);
}
