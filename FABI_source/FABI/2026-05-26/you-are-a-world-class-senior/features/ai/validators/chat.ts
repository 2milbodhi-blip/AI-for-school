import { z } from "zod";
import { learningLevels, scholarModes } from "@/features/ai/types";

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  mode: z.enum(scholarModes),
  level: z.enum(learningLevels),
  humanize: z.boolean().default(true),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(6000)
      })
    )
    .min(1)
    .max(20)
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
