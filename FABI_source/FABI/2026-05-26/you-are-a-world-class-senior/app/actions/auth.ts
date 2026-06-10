"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserFacingSupabaseError, logSupabaseDiagnostic, validateSupabaseEnv } from "@/lib/supabase/diagnostics";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

function getAuthValues(formData: FormData) {
  return authSchema.parse({
    email: formData.get("email"),
    password: formData.get("password")
  });
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function signIn(formData: FormData) {
  let email = "unknown";

  try {
    const values = getAuthValues(formData);
    email = values.email;

    const envError = validateSupabaseEnv();
    if (envError) {
      console.error("[supabase:signin:config]", { error: envError });
      redirect(`/login?error=${encodeURIComponent(envError)}`);
    }

    const supabase = await createClient();

    console.info("[supabase:signin:request]", {
      emailDomain: email.split("@")[1] ?? "unknown",
      projectUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: values.password
    });

    if (error) {
      logSupabaseDiagnostic("signin:error", error);
      redirect(`/login?error=${encodeURIComponent(getUserFacingSupabaseError(error))}`);
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    logSupabaseDiagnostic("signin:exception", error);
    redirect(`/login?error=${encodeURIComponent(getUserFacingSupabaseError(error))}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  let email = "unknown";

  try {
    const values = getAuthValues(formData);
    email = values.email;

    const envError = validateSupabaseEnv();
    if (envError) {
      console.error("[supabase:signup:config]", { error: envError });
      redirect(`/signup?error=${encodeURIComponent(envError)}`);
    }

    const supabase = await createClient();

    console.info("[supabase:signup:request]", {
      emailDomain: email.split("@")[1] ?? "unknown",
      projectUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password: values.password
    });

    if (error) {
      logSupabaseDiagnostic("signup:error", error);
      redirect(`/signup?error=${encodeURIComponent(getUserFacingSupabaseError(error))}`);
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        display_name: email.split("@")[0],
        grade_level: "high-school"
      });

      if (profileError) {
        logSupabaseDiagnostic("signup:profile", profileError);
        redirect(`/signup?error=${encodeURIComponent(getUserFacingSupabaseError(profileError))}`);
      }
    }
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    logSupabaseDiagnostic("signup:exception", error);
    redirect(`/signup?error=${encodeURIComponent(getUserFacingSupabaseError(error))}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    logSupabaseDiagnostic("signout:error", error);
  }
  redirect("/");
}
