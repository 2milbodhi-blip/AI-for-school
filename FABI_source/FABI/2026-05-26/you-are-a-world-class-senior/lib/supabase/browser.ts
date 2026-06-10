import { createBrowserClient } from "@supabase/ssr";
import { validateSupabaseEnv } from "@/lib/supabase/diagnostics";

export function createClient() {
  const envError = validateSupabaseEnv();
  if (envError) {
    throw new Error(envError);
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
