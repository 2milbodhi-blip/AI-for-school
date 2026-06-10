import type { ChatRequest } from "@/features/ai/validators/chat";

type ChatMessage = ChatRequest["messages"][number];

const RECENT_MESSAGE_COUNT = 8;
const OLDER_MESSAGE_PREVIEW_CHARS = 360;
const MAX_MESSAGE_CHARS = 2400;
const MAX_LATEST_USER_CHARS = 5000;
const MAX_CONTEXT_TOKENS = 6500;

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function estimateTokensFromChars(chars: number) {
  return Math.ceil(chars / 4);
}

function compactWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function truncateText(text: string, maxChars: number) {
  const compact = compactWhitespace(text);

  if (compact.length <= maxChars) {
    return compact;
  }

  return `${compact.slice(0, maxChars - 24).trim()}... [truncated]`;
}

function summarizeOlderMessages(messages: ChatMessage[]) {
  if (messages.length === 0) {
    return null;
  }

  const summary = messages
    .map((message, index) => {
      const label = message.role === "user" ? "Student" : "ScholarAI";
      return `${index + 1}. ${label}: ${truncateText(message.content, OLDER_MESSAGE_PREVIEW_CHARS)}`;
    })
    .join("\n");

  return {
    role: "user" as const,
    content:
      "Compressed earlier conversation for continuity. Use only when relevant; prioritize the latest request.\n" +
      summary
  };
}

export function buildOptimizedMessages(messages: ChatMessage[]) {
  const recent = messages.slice(-RECENT_MESSAGE_COUNT).map((message, index, list) => {
    const isLatestUser = index === list.length - 1 && message.role === "user";
    return {
      ...message,
      content: truncateText(message.content, isLatestUser ? MAX_LATEST_USER_CHARS : MAX_MESSAGE_CHARS)
    };
  });

  const olderSummary = summarizeOlderMessages(messages.slice(0, -RECENT_MESSAGE_COUNT));
  const optimized = olderSummary ? [olderSummary, ...recent] : recent;

  while (
    optimized.length > 1 &&
    estimateTokens(optimized.map((message) => message.content).join("\n")) > MAX_CONTEXT_TOKENS
  ) {
    optimized.splice(olderSummary ? 1 : 0, 1);
  }

  return optimized;
}

export function getContextStats(originalMessages: ChatMessage[], optimizedMessages: ChatMessage[]) {
  const originalChars = originalMessages.reduce((total, message) => total + message.content.length, 0);
  const optimizedChars = optimizedMessages.reduce((total, message) => total + message.content.length, 0);

  return {
    originalMessages: originalMessages.length,
    sentMessages: optimizedMessages.length,
    estimatedInputTokensBefore: estimateTokensFromChars(originalChars),
    estimatedInputTokensAfter: estimateTokensFromChars(optimizedChars),
    estimatedSavedInputTokens: Math.max(0, estimateTokensFromChars(originalChars) - estimateTokensFromChars(optimizedChars))
  };
}
