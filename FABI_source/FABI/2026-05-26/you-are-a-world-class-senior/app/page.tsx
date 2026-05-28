import Link from "next/link";
import { BookOpen, CalendarCheck, FileText, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: MessageSquareText, label: "Guided tutoring, not answer dumping" },
  { icon: ShieldCheck, label: "Academic-integrity guardrails built in" },
  { icon: BookOpen, label: "Research, notes, essays, and flashcards" },
  { icon: CalendarCheck, label: "Planner for tasks and deadlines" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[var(--primary)] text-white">
              <BookOpen size={19} />
            </span>
            ScholarAI
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Open app</Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 md:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted-foreground)]">
              <Sparkles size={16} className="text-[var(--primary)]" />
              AI study help with boundaries
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              ScholarAI
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
              A calm, trustworthy tutor for homework guidance, research, notes, essays,
              flashcards, and planning. It helps students learn without doing dishonest work
              for them.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Start learning</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Today&apos;s focus</p>
                <h2 className="text-xl font-semibold">Biology study session</h2>
              </div>
              <span className="rounded-md bg-[#e7f4f1] px-3 py-1 text-sm text-[var(--primary)]">
                Guided
              </span>
            </div>
            <div className="space-y-3">
              {highlights.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-md bg-[var(--muted)] p-3">
                  <item.icon className="text-[var(--primary)]" size={20} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-[var(--border)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <FileText size={17} className="text-[var(--primary)]" />
                Example study flow
              </div>
              <div className="space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                <p>1. Paste notes or a prompt.</p>
                <p>2. Pick a mode and learning level.</p>
                <p>3. Get hints, outlines, practice questions, and next steps.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
