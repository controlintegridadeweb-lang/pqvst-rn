import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAuthClient(remember = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("O acesso institucional exige a URL pública e a chave anônima.");
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            if (remember) {
              cookieStore.set(name, value, options);
              continue;
            }
            const sessionOptions = { ...options };
            delete sessionOptions.maxAge;
            delete sessionOptions.expires;
            cookieStore.set(name, value, sessionOptions);
          }
        } catch {
          // A leitura da sessão em Server Component não pode gravar cookie.
          // A renovação fica na ação de entrada e no proxy.
        }
      },
    },
  });
}
