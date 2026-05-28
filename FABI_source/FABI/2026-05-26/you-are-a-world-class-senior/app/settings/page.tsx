import { redirect } from "next/navigation";
import { saveProfile } from "@/app/actions/profile";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const gradeOptions = [
  ["simple-student", "Simple Student"],
  ["high-school", "High School"],
  ["college", "College"],
  ["professional", "Professional"],
  ["extremely-simplified", "Extremely Simplified"]
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, grade_level, subjects, writing_style")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen px-5 py-6">
      <section className="mx-auto max-w-3xl rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Learning profile</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              ScholarAI uses this to explain things at the right level.
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              Log out
            </Button>
          </form>
        </div>

        <form action={saveProfile} className="grid gap-5">
          <label className="block text-sm font-medium">
            Display name
            <input
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              defaultValue={profile?.display_name ?? user.email?.split("@")[0] ?? ""}
              name="displayName"
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Learning level
            <select
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              defaultValue={profile?.grade_level ?? "high-school"}
              name="gradeLevel"
            >
              {gradeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Subjects
            <input
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              defaultValue={(profile?.subjects ?? []).join(", ")}
              name="subjects"
              placeholder="Math, Biology, History"
            />
          </label>

          <label className="block text-sm font-medium">
            Writing preference
            <select
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              defaultValue={profile?.writing_style ?? "natural"}
              name="writingStyle"
            >
              <option value="natural">Natural</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>

          <Button className="w-full md:w-fit" type="submit">
            Save profile
          </Button>
        </form>
      </section>
    </main>
  );
}
