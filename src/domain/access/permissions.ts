import { fail, ok, type DomainResult } from "@/domain/shared/result";

export type AppRole = "state_admin" | "org_manager";

export type Actor =
  | { kind: "state_admin"; userId: string }
  | { kind: "org_manager"; userId: string; organizationIds: readonly string[] }
  | { kind: "anonymous" };

export type ProtectedAction =
  | "manage_organizations"
  | "manage_members"
  | "manage_cycles"
  | "publish_results"
  | "read_audit"
  | "read_org_indicators"
  | "manage_action_plan"
  | "issue_credentials"
  | "read_raw_answers";

export interface AccessRequest {
  action: ProtectedAction;
  organizationId?: string;
}

/**
 * Autorização de aplicação. O órgão do gestor vem do vínculo persistido,
 * nunca de um parâmetro livre do navegador.
 * Nenhum papel de usuário lê respostas brutas.
 */
export function authorize(actor: Actor, request: AccessRequest): DomainResult<true> {
  if (request.action === "read_raw_answers") {
    return fail(
      "raw_answers_forbidden",
      "Respostas individuais não ficam disponíveis para perfis da aplicação.",
    );
  }

  if (actor.kind === "anonymous") {
    return fail("unauthenticated", "Esta ação exige autenticação institucional.");
  }

  if (actor.kind === "state_admin") {
    return ok(true);
  }

  if (
    request.action === "manage_organizations" ||
    request.action === "manage_members" ||
    request.action === "manage_cycles" ||
    request.action === "publish_results" ||
    request.action === "read_audit"
  ) {
    return fail("state_admin_required", "Somente a administração estadual pode executar esta ação.");
  }

  if (!request.organizationId) {
    return fail("organization_required", "A ação do gestor exige o órgão do vínculo.");
  }
  if (!actor.organizationIds.includes(request.organizationId)) {
    return fail("wrong_organization", "O gestor não possui vínculo com este órgão.");
  }
  return ok(true);
}
