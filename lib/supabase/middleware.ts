import {NextResponse,type NextRequest} from 'next/server'
import {createServerClient} from '@supabase/ssr'
import type {Database} from '@/types/database'

type UpdateSessionOptions = {
  redirectUnauthenticated?: boolean
}

export async function updateSession(
  request:NextRequest,
  options:UpdateSessionOptions={}
){
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // Defensive: environments without Supabase configuration (e.g. local preview
  // sandbox) must not crash every matched request. Pass through untouched so
  // static assets (public/*) and the /login page still render. Production has
  // these env vars set, so auth enforcement there is unchanged.
  if(!supabaseUrl||!supabaseKey)return NextResponse.next({request})

  let response=NextResponse.next({request})
  const supabase=createServerClient<Database>(supabaseUrl,supabaseKey,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cs){cs.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cs.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}})
  const {data:{user}}=await supabase.auth.getUser()
  const isLogin=request.nextUrl.pathname==='/login'
  const redirectUnauthenticated=options.redirectUnauthenticated??true
  if(!user&&!isLogin&&redirectUnauthenticated)return NextResponse.redirect(new URL('/login',request.url))
  if(user&&isLogin)return NextResponse.redirect(new URL('/dashboard',request.url))
  return response
}
