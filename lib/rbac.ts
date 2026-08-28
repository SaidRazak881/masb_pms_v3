import {createClient} from '@/lib/supabase/server'
import type {UserRole} from '@/types/database'
export async function getCurrentUser(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data:profile}=await s.from('profiles').select('id,full_name,email,role,is_active,must_reset_password').eq('id',user.id).single();return profile?{...profile,user}:null}
export function can(role:UserRole,allowed:UserRole[]){return allowed.includes(role)}
export const WRITE_ROLES:UserRole[]=['super_admin','admin','manager','pic']
