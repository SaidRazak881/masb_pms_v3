'use client'
import {createClient} from '@/lib/supabase/client'
export function SignOutButton(){return <button className='w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50' onClick={async()=>{await createClient().auth.signOut();location.href='/login'}}>Sign out</button>}
