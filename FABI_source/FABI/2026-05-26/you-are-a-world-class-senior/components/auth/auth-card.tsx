import Link from "next/link";
import { BookOpen, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthCardProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  footerLabel: string;
  footerHref: string;
  footerAction: string;
  error?: string;
};

export function AuthCard({
  title,
  description,
  action,
  buttonLabel,
  footerLabel,
  footerHref,
  footerAction,
  error
}: AuthCardProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 py-8">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[var(--primary)] text-white">
            <BookOpen size={19} />
          </span>
          ScholarAI
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-[var(--muted)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          <LockKeyhole size={15} className="text-[var(--primary)]" />
          Your study sessions are tied to your account.
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form action={action} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-2 h-11 w-full rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </label>
          <Button className="w-full" type="submit">
            {buttonLabel}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
          {footerLabel}{" "}
          <Link className="font-medium text-[var(--primary)] underline-offset-4 hover:underline" href={footerHref}>
            {footerAction}
          </Link>
        </p>
      </section>
    </main>
  );
}
