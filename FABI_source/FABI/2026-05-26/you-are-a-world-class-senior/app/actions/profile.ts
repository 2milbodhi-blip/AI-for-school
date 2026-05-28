"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().min(1).max(80),
  gradeLevel: z.enum(["simple-student", "high-school", "college", "professional", "extremely-simplified"]),
  subjects: z.string().max(300),
  writingStyle: z.enum(["natural", "concise", "detailed"])
});

export async function saveProfile(formData: FormData) {
  const values = profileSchema.parse({
    displayName: formData.get("displayName"),
    gradeLevel: formData.get("gradeLevel"),
    subjects: formData.get("subjects"),
    writingStyle: formData.get("writingStyle")
  });

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subjectList = values.subjects
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);

  await supabase.from("profiles").upsert({
    user_id: user.id,
    display_name: values.displayName,
    grade_level: values.gradeLevel,
    subjects: subjectList,
    writing_style: values.writingStyle,
    updated_at: new Date().toISOString()
  });

  revalidatePath("/settings");
}
