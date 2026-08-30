import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import type {User} from '@supabase/supabase-js'
import type {UserRole} from '@/types/database'

export type AuthContext={user:User;role:UserRole}

export async function requireUser():Promise<AuthContext>{
  const supabase=await createClient()
  const {data,error}=await supabase.auth.getUser()
  if(error||!data.user) redirect('/login')
  const {data:profile,error:profileError}=await supabase.from('profiles').select('role,is_active').eq('id',data.user.id).maybeSingle()
  if(profileError||!profile||!profile.is_active){await supabase.auth.signOut();redirect('/login')}
  return {user:data.user,role:profile.role}
}

export async function requireRole(roles:UserRole[]){const context=await requireUser();if(!roles.includes(context.role))redirect('/dashboard');return context}
export async function requireSuperAdmin(){return requireRole(['super_admin'])}
export async function requireEditor(){return requireRole(['super_admin','masb_team'])}
