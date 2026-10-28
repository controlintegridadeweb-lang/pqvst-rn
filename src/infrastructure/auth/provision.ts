import "server-only";

import { createServiceClient } from "@/infrastructure/supabase/admin";
import type { AdministratorAccount } from "@/domain/access/administrator";
import { fail, ok, type DomainResult } from "@/domain/shared/result";

export async function stateAdminExists(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  const client = createServiceClient();
  const { count, error } = await client
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "state_admin");
  if (error || count === null) return true;
  return count > 0;
}

export async function createStateAdminAccount(account: AdministratorAccount): Promise<DomainResult<true>> {
  if (await stateAdminExists()) {
    return fail("administrator_exists", "O administrador estadual já existe. Entre com essa conta.");
  }

  const client = createServiceClient();
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
    return fail("administrator_failed", "Não foi possível criar o administrador estadual.");
  }

  const userId = data.user.id;
  if (await stateAdminExists()) {
    await client.auth.admin.deleteUser(userId);
    return fail("administrator_exists", "O administrador estadual já existe. Entre com essa conta.");
  }

  const { error: profileError } = await client.from("user_profiles").insert({
    id: userId,
    full_name: account.fullName,
    role: "state_admin",
  });
  if (profileError) {
    await client.auth.admin.deleteUser(userId);
    return fail("administrator_failed", "Não foi possível gravar o perfil de administrador.");
  }
  return ok(true);
}

