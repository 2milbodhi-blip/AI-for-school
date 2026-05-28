import { generateText } from "ai";
import { NextResponse } from "next/server";
import { buildScholarSystemPrompt } from "@/features/ai/prompts/system";
import { checkAcademicIntegrity } from "@/features/ai/policies/academic-integrity";
import { getScholarModel } from "@/features/ai/providers/model";
import { streamPlainText } from "@/features/ai/streaming/text-response";
import { chatRequestSchema } from "@/features/ai/validators/chat";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { sanitizeUserText } from "@/lib/security/sanitize";
import { persistChatTurn } from "@/server/services/chat-persistence";

export const runtime = "edge";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rate = checkRateLimit(`chat:${ip}`, 15, 60_000);

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

  if (process.env.AI_PROVIDER === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    return streamPlainText("Anthropic is selected, but ANTHROPIC_API_KEY is missing in .env.local.");
  }

  if (process.env.AI_PROVIDER !== "anthropic" && !process.env.OPENAI_API_KEY) {
    return streamPlainText("OpenAI is selected, but OPENAI_API_KEY is missing in .env.local.");
  }

  try {
    const result = await generateText({
      model: getScholarModel(),
      system: buildScholarSystemPrompt({
        mode: parsed.data.mode,
        level: parsed.data.level,
        humanize: parsed.data.humanize
      }),
      messages: cleanMessages
    });

    await persistChatTurn({
      conversationId: parsed.data.conversationId,
      mode: parsed.data.mode,
      userMessage: latestUserText,
      assistantMessage: result.text,
      metadata: {
        level: parsed.data.level,
        humanize: parsed.data.humanize,
        finishReason: result.finishReason,
        usage: result.usage
      }
    });

    return new Response(result.text || "I could not generate a response. Try again in a moment.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI provider request failed.";
    return new Response(`ScholarAI could not reach the AI provider: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
