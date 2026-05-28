import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export function getScholarModel() {
  if (process.env.AI_PROVIDER === "anthropic") {
    return anthropic("claude-3-5-sonnet-latest");
  }

  return openai("gpt-4.1-mini");
}
