import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Organization } from "@/types/database";

export type Role =
  | "admin"
  | "caregiver"
  | "nurse_reviewer"
  | "ops_staff"
  | "billing_staff"
  | "compliance_admin";

export type AuthenticatedUser = User & {
  organizations: Organization;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("*, organizations(*)")
    .eq("id", authUser.id)
    .single();

  const appUser = data as AuthenticatedUser | null;
  if (!appUser) redirect("/login");

  return appUser;
}

// Admin retains the catch-all top-tier role — anywhere that only asks for
// "admin" is implicitly also allowing compliance_admin once that role
// starts carrying distinct behavior (currently equivalent).
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (user.role !== "admin" && user.role !== "compliance_admin") {
    redirect("/today");
  }
  return user;
}

// requireRole([...]) lets a server page declare which roles may view it.
// admin is always allowed unless the list explicitly excludes it — admins
// are the top tier and should be able to inspect anything.
export async function requireRole(
  roles: Role[],
  options: { allowAdmin?: boolean } = { allowAdmin: true }
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  const allowAdmin = options.allowAdmin !== false;
  const ok =
    (allowAdmin && (user.role === "admin" || user.role === "compliance_admin")) ||
    roles.includes(user.role as Role);
  if (!ok) redirect("/today");
  return user;
}

// Roles that should never reach clinical pages (notes, incidents, summaries,
// voice). Billing and ops get org-level access to demographics and scheduling
// but are blocked from clinical content. Use this in page-level guards so the
// UI matches the RLS enforcement in migration 00010.
export const NON_CLINICAL_ROLES: Role[] = ["ops_staff", "billing_staff"];

export function isClinicalRole(role: string): boolean {
  return !NON_CLINICAL_ROLES.includes(role as Role);
}
