import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { validateSupabaseEnv } from "@/lib/supabase/diagnostics";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function createClient() {
  const envError = validateSupabaseEnv();
  if (envError) {
    throw new Error(envError);
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Middleware refreshes the
            // session for normal requests, so this path remains safe.
          }
        }
      }
    }
  );
}
