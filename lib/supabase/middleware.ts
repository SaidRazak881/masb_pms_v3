import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response.cookies.set(name, value, options); }),
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const publicPath = path === "/login" || path.startsWith("/auth/") || path.startsWith("/_next/") || path === "/favicon.ico";
  if (!user && !publicPath) return NextResponse.redirect(new URL("/login", request.url));
  if (user && path === "/login") return NextResponse.redirect(new URL("/", request.url));
  return response;
}
