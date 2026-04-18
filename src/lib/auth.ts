import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Organization } from "@/types/database";

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

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (user.role !== "admin") redirect("/today");
  return user;
}
