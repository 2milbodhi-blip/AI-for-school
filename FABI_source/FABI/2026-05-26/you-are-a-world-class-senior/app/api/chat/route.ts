import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildScholarSystemPrompt } from "@/features/ai/prompts/system";
import { checkAcademicIntegrity } from "@/features/ai/policies/academic-integrity";
import { buildOptimizedMessages, estimateTokens, getContextStats } from "@/features/ai/context/optimize";
import { classifyProviderError } from "@/features/ai/providers/errors";
import { getAIProviderName, getMaxOutputTokens, getScholarModel, validateAIProviderConfig } from "@/features/ai/providers/model";
import { streamPlainText } from "@/features/ai/streaming/text-response";
import { chatRequestSchema } from "@/features/ai/validators/chat";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { checkUsageQuota, recordActualUsage } from "@/lib/rate-limit/usage-quota";
import { sanitizeUserText } from "@/lib/security/sanitize";
import { persistChatTurn } from "@/server/services/chat-persistence";

export const runtime = "edge";

function makeRequestId() {
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function POST(request: Request) {
  const requestId = makeRequestId();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const userKey = request.headers.get("x-user-id") ?? ip;
  const rate = checkRateLimit(`chat:${userKey}`, 10, 60_000);

  if (!rate.allowed) {
    return streamPlainText("Too many messages. Please wait a minute and try again.", { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const cleanMessages = parsed.data.messages.map((message) => ({
    ...message,
    content: sanitizeUserText(message.content)
  }));

  const latestUserText = [...cleanMessages].reverse().find((message) => message.role === "user")?.content ?? "";
  const integrity = checkAcademicIntegrity(latestUserText);

  if (!integrity.allowed) {
    return streamPlainText(integrity.redirect);
  }

  const configError = validateAIProviderConfig();
  if (configError) {
    console.error("[chat:config]", {
      requestId,
      provider: process.env.AI_PROVIDER ?? "openai",
      error: configError
    });
    return streamPlainText(configError, { status: 500 });
  }

  try {
    const optimizedMessages = buildOptimizedMessages(cleanMessages);
    const system = buildScholarSystemPrompt({
      mode: parsed.data.mode,
      level: parsed.data.level,
      humanize: parsed.data.humanize
    });
    const contextStats = getContextStats(cleanMessages, optimizedMessages);
    const maxTokens = getMaxOutputTokens(parsed.data.mode);
    const estimatedRequestTokens =
      estimateTokens(system) +
      contextStats.estimatedInputTokensAfter +
      maxTokens;
    const quota = checkUsageQuota(`usage:${userKey}`, estimatedRequestTokens);

    if (!quota.allowed) {
      return streamPlainText("Daily AI usage limit reached for this preview. Please try again tomorrow.", { status: 429 });
    }

    console.info("[chat:request]", {
      requestId,
      provider: getAIProviderName(),
      mode: parsed.data.mode,
      maxTokens,
      estimatedRequestTokens,
      contextStats
    });

    const result = await generateText({
      model: getScholarModel(parsed.data.mode),
      system,
      messages: optimizedMessages,
      maxTokens
    });

    const actualTokens =
      (result.usage.promptTokens ?? 0) +
      (result.usage.completionTokens ?? 0);

    if (actualTokens > 0) {
      recordActualUsage(`usage:${userKey}`, actualTokens, estimatedRequestTokens);
    }

    await persistChatTurn({
      conversationId: parsed.data.conversationId,
      mode: parsed.data.mode,
      userMessage: latestUserText,
      assistantMessage: result.text,
      metadata: {
        level: parsed.data.level,
        humanize: parsed.data.humanize,
        finishReason: result.finishReason,
        usage: result.usage,
        costControls: {
          modelTier: process.env.AI_PROVIDER === "anthropic" ? "anthropic" : parsed.data.mode,
          maxTokens,
          remainingDailyEstimatedTokens: quota.remainingTokens,
          contextStats
        }
      }
    });

    console.info("[chat:success]", {
      requestId,
      provider: getAIProviderName(),
      finishReason: result.finishReason,
      usage: result.usage
    });

    return new Response(result.text || "I could not generate a response. Try again in a moment.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (error) {
    const classified = classifyProviderError(error, getAIProviderName());
    console.error("[chat:error]", {
      requestId,
      provider: getAIProviderName(),
      code: classified.code,
      status: classified.status,
      message: classified.providerMessage
    });

    return streamPlainText(`${classified.userMessage} Diagnostic ID: ${requestId}`, {
      status: classified.status
    });
  }
}
