type ClassifiedProviderError = {
  status: number;
  userMessage: string;
  code: string;
  providerMessage: string;
};

type ErrorWithDetails = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
  type?: string;
  cause?: unknown;
  response?: {
    status?: number;
    statusText?: string;
  };
};

function stringifyUnknown(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown provider error.";
  }
}

function getStatus(error: ErrorWithDetails) {
  return error.status ?? error.statusCode ?? error.response?.status;
}

export function classifyProviderError(error: unknown, provider: string): ClassifiedProviderError {
  const details = error as ErrorWithDetails;
  const providerMessage = stringifyUnknown(error);
  const lowerMessage = providerMessage.toLowerCase();
  const lowerCode = String(details.code ?? details.type ?? "").toLowerCase();
  const status = getStatus(details);

  if (status === 401 || lowerMessage.includes("incorrect api key") || lowerMessage.includes("invalid api key")) {
    return {
      status: 401,
      code: "invalid_api_key",
      providerMessage,
      userMessage: `${provider} authentication failed. Check that the API key in .env.local is valid.`
    };
  }

  if (
    lowerMessage.includes("quota") ||
    lowerMessage.includes("billing") ||
    lowerMessage.includes("insufficient_quota") ||
    lowerCode.includes("insufficient_quota")
  ) {
    return {
      status: 429,
      code: "quota_exceeded",
      providerMessage,
      userMessage: `${provider} quota exceeded. Check billing, credits, and usage limits for the API key.`
    };
  }

  if (status === 429 || lowerCode.includes("rate_limit") || lowerMessage.includes("rate limit")) {
    return {
      status: 429,
      code: "rate_limited",
      providerMessage,
      userMessage: `${provider} rate limit reached. Wait a moment and try again.`
    };
  }

  if (status === 403 || lowerMessage.includes("permission") || lowerMessage.includes("access denied")) {
    return {
      status: 403,
      code: "provider_forbidden",
      providerMessage,
      userMessage: `${provider} rejected this request. Check model access and API key permissions.`
    };
  }

  if (
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("cannot connect to api") ||
    lowerMessage.includes("failed after") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("timeout") ||
    lowerCode.includes("econn") ||
    lowerCode.includes("etimedout")
  ) {
    return {
      status: 502,
      code: "provider_network_error",
      providerMessage,
      userMessage: `Network error while contacting ${provider}. Check server internet access and provider availability.`
    };
  }

  return {
    status: status && status >= 400 ? status : 500,
    code: "provider_unavailable",
    providerMessage,
    userMessage: `${provider} is unavailable right now: ${providerMessage}`
  };
}
