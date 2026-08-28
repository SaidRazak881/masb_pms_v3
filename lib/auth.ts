import {redirect} from 'next/navigation'
import {createServerClient} from '@/lib/supabase/server'
import type {UserRole} from '@/types/database'

export type AuthContext={user:NonNullable<Awaited<ReturnType<ReturnType<typeof createServerClient>['auth']['getUser']>>['data']['user']>;role:UserRole}

export async function requireUser(){
  const supabase=await createServerClient()
  const {data,error}=await supabase.auth.getUser()
  if(error||!data.user) redirect('/login')
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',data.user.id).maybeSingle()
  if(!profile?.is_active) { await supabase.auth.signOut(); redirect('/login') }
  return {user:data.user,role:profile.role}
}

export async function requireRole(roles:UserRole[]){
  const ctx=await requireUser()
  if(!roles.includes(ctx.role)) redirect('/dashboard')
  return ctx
}
export async function requireAdmin(){return requireRole(['super_admin','admin'])}
export async function requireManagerOrAbove(){return requireRole(['super_admin','admin','manager'])}
