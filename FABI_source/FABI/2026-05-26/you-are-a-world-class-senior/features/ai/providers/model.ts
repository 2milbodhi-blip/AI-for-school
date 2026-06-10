import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { ScholarMode } from "@/features/ai/types";

const lowCostModes = new Set<ScholarMode>(["flashcard-creator", "note-summarizer", "planner"]);

export function getAIProviderName() {
  return process.env.AI_PROVIDER === "anthropic" ? "Anthropic" : "OpenAI";
}

export function validateAIProviderConfig() {
  if (process.env.AI_PROVIDER === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      return "Anthropic is selected, but ANTHROPIC_API_KEY is missing in .env.local.";
    }

    return null;
  }

  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "openai") {
    return `Unsupported AI_PROVIDER "${process.env.AI_PROVIDER}". Use "openai" or "anthropic".`;
  }

  if (!process.env.OPENAI_API_KEY) {
    return "OpenAI is selected, but OPENAI_API_KEY is missing in .env.local.";
  }

  return null;
}

export function getScholarModel(mode?: ScholarMode) {
  if (process.env.AI_PROVIDER === "anthropic") {
    return anthropic(process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest");
  }

  if (process.env.OPENAI_MODEL) {
    return openai(process.env.OPENAI_MODEL);
  }

  return openai(mode && lowCostModes.has(mode) ? "gpt-4.1-nano" : "gpt-4.1-mini");
}

export function getMaxOutputTokens(mode: ScholarMode) {
  const limits: Record<ScholarMode, number> = {
    "homework-helper": 900,
    "research-assistant": 1000,
    "essay-coach": 1000,
    "flashcard-creator": 700,
    "note-summarizer": 650,
    planner: 550
  };

  const configuredLimit = Number(process.env.AI_MAX_OUTPUT_TOKENS);

  if (Number.isFinite(configuredLimit) && configuredLimit > 0) {
    return configuredLimit;
  }

  return limits[mode];
}
