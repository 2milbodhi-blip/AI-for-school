import { signIn } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      action={signIn}
      buttonLabel="Log in"
      description="Welcome back. Log in to continue your study sessions."
      error={params.error}
      footerAction="Create one"
      footerHref="/signup"
      footerLabel="Need an account?"
      title="Log in"
    />
  );
}
