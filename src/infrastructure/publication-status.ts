import "server-only";

export type PublicationAvailability =
  | "database_not_configured"
  | "publication_source_not_connected";

export function getPublicationAvailability(): PublicationAvailability {
  const hasPublicConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return hasPublicConfig ? "publication_source_not_connected" : "database_not_configured";
}

export function adminRuntimeStatus() {
  return {
    publicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    participationPepper: (process.env.PARTICIPATION_TOKEN_PEPPER?.length ?? 0) >= 32,
  };
}

export function isAdminEntryOpen(status = adminRuntimeStatus()) {
  return status.publicUrl && status.anonKey && status.serviceRole && status.participationPepper;
}
