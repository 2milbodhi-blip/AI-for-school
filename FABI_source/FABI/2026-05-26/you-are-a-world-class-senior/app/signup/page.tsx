import { signUp } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      action={signUp}
      buttonLabel="Create account"
      description="Start with a free ScholarAI account so your chats, notes, and tasks can be saved."
      error={params.error}
      footerAction="Log in"
      footerHref="/login"
      footerLabel="Already have an account?"
      title="Create your account"
    />
  );
}
