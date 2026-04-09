import { createClient } from "./server";

/**
 * Returns the current Supabase session from server context.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Returns the Profile record for the currently authenticated user.
 * Returns null if not authenticated or no profile found.
 */
export async function getProfile() {
  const session = await getSession();
  if (!session) return null;

  const { prisma } = await import("@/lib/db/prisma");
  return prisma.profile.findUnique({ where: { id: session.user.id } });
}
