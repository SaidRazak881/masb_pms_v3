"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim(); const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Email%20and%20password%20are%20required");
  const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
  redirect("/");
}
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }
