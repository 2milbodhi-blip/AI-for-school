import type { ScholarMode } from "@/features/ai/types";
import { createClient } from "@/lib/supabase/server";

type PersistChatInput = {
  conversationId?: string;
  mode: ScholarMode;
  userMessage: string;
  assistantMessage: string;
  metadata?: Record<string, unknown>;
};

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function persistChatTurn(input: PersistChatInput) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  let conversationId = input.conversationId;

  if (!conversationId) {
    const title = input.userMessage.slice(0, 60) || "New conversation";
    const { data } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
        mode: input.mode
      })
      .select("id")
      .single();

    conversationId = data?.id;
  }

  if (!conversationId) {
    return;
  }

  await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: input.userMessage,
      metadata: input.metadata ?? {}
    },
    {
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: input.assistantMessage,
      metadata: input.metadata ?? {}
    }
  ]);

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", user.id);
}
