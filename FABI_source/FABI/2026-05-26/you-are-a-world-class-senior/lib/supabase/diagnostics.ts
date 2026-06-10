type SupabaseErrorDetails = {
  status?: number;
  code?: string;
  name?: string;
  message: string;
};

type SupabaseLikeError = Error & {
  status?: number;
  code?: string;
  cause?: unknown;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Supabase error.";
  }
}

export function validateSupabaseEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local.";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
  }

  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (!url.hostname.endsWith(".supabase.co")) {
      return "NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase project URL.";
    }
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.";
  }

  return null;
}

export function getSupabaseErrorDetails(error: unknown): SupabaseErrorDetails {
  const details = error as SupabaseLikeError;

  return {
    status: details.status,
    code: details.code,
    name: details.name,
    message: getErrorMessage(error)
  };
}

export function getUserFacingSupabaseError(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const message = details.message;
  const lower = message.toLowerCase();

  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("enotfound") ||
    lower.includes("econn") ||
    lower.includes("timeout")
  ) {
    return "Supabase network error: the app could not reach the configured Supabase project. Check the project URL, project status, internet access, and whether the project is paused.";
  }

  if (details.status === 401 || lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Supabase authentication failed: the anon key appears invalid for this project.";
  }

  if (lower.includes("email logins are disabled") || lower.includes("signup disabled")) {
    return "Supabase email/password auth is disabled for this project.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid login credentials.";
  }

  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }

  return `Supabase auth error: ${message}`;
}

export function logSupabaseDiagnostic(scope: string, error: unknown) {
  const details = getSupabaseErrorDetails(error);
  console.error(`[supabase:${scope}]`, {
    ...details,
    projectUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  });
}
