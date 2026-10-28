"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readAccess } from "@/infrastructure/auth/session";
import { isAdminEntryOpen } from "@/infrastructure/publication-status";
import { createAuthClient } from "@/infrastructure/supabase/server";
import { parseAdministratorAccount } from "@/domain/access/administrator";
import { createStateAdminAccount } from "@/infrastructure/auth/provision";

export interface SignInState {
  error: string | null;
  notice: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  if (!isAdminEntryOpen()) {
    return { error: "A entrada administrativa ainda depende da configuração do servidor.", notice: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL.test(email) || password.length < 8) {
    return { error: "Informe o e-mail institucional e a senha.", notice: null };
  }

  const remember = formData.get("remember") === "on";
  const supabase = await createAuthClient(remember);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "E-mail ou senha não conferem.", notice: null };
  }

  const access = await readAccess(supabase);
  if (access.status !== "ready") {
    await supabase.auth.signOut();
    return { error: "Esta conta não possui papel institucional. O acesso não foi aberto.", notice: null };
  }

  redirect("/gestao");
}

export async function requestPasswordReset(_previous: SignInState, formData: FormData): Promise<SignInState> {
  if (!isAdminEntryOpen()) {
    return { error: "A entrada administrativa ainda depende da configuração do servidor.", notice: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) {
    return { error: "Informe o e-mail institucional.", notice: null };
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (!host) {
    return { error: "Não foi possível enviar a redefinição agora.", notice: null };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/acesso/confirmar`,
  });
  if (error) {
    return { error: "Não foi possível enviar a redefinição agora.", notice: null };
  }

  return {
    error: null,
    notice: "Se houver conta institucional nesse e-mail, o link de redefinição foi enviado.",
  };
}

export async function updatePassword(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password !== confirmation) {
    return { error: "A senha precisa ter ao menos 8 caracteres e ser igual nos dois campos.", notice: null };
  }

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { error: "O link de redefinição expirou. Peça outro na entrada de gestores.", notice: null };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Não foi possível atualizar a senha.", notice: null };
  }

  redirect("/acesso");
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/acesso");
}

export async function createStateAdministrator(_previous: SignInState, formData: FormData): Promise<SignInState> {
  if (!isAdminEntryOpen()) {
    return { error: "A entrada administrativa ainda depende da configuração do servidor.", notice: null };
  }

  const parsed = parseAdministratorAccount({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error.message, notice: null };

  const created = await createStateAdminAccount(parsed.value);
  if (!created.ok) return { error: created.error.message, notice: null };

  const supabase = await createAuthClient(true);
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.value.email,
    password: parsed.value.password,
  });
  if (error) {
    return { error: null, notice: "Administrador criado. Entre com o e-mail e a senha." };
  }

  const access = await readAccess(supabase);
  if (access.status !== "ready" || access.session.role !== "state_admin") {
    await supabase.auth.signOut();
    return { error: "O perfil de administrador não ficou disponível para entrada.", notice: null };
  }

  redirect("/gestao");
}
