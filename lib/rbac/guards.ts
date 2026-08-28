import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/rbac/roles";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireRole(roles: UserRole[]) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("role,is_active,full_name,email").eq("id", user.id).single();
  if (!profile?.is_active || !roles.includes(profile.role as UserRole)) redirect("/");
  return { supabase, user, profile };
}
