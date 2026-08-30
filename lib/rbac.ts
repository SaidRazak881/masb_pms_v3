import {createClient} from '@/lib/supabase/server'
import type {UserRole} from '@/types/database'

export async function getCurrentUser(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data:profile}=await s.from('profiles').select('id,full_name,email,role,is_active,must_reset_password').eq('id',user.id).single();return profile?{...profile,user}:null}
export function can(role:UserRole,allowed:UserRole[]){return allowed.includes(role)}
export const EDIT_ROLES:UserRole[]=['super_admin','masb_team']
export const BULK_IMPORT_ROLES:UserRole[]=['super_admin']
export const VIEW_ONLY_ROLES:UserRole[]=['viewer']
export function isEditor(role:UserRole){return EDIT_ROLES.includes(role)}
export function canBulkImport(role:UserRole){return BULK_IMPORT_ROLES.includes(role)}
