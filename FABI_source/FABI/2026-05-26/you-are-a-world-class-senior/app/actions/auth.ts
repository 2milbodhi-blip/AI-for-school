"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
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

export async function signIn(formData: FormData) {
  const { email, password } = getAuthValues(formData);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const { email, password } = getAuthValues(formData);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("profiles").insert({
      user_id: data.user.id,
      display_name: email.split("@")[0],
      grade_level: "high-school"
    });
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
