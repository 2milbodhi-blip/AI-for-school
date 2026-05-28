"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  Menu,
  PenLine,
  Send,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningLevel, ScholarMode } from "@/features/ai/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const modes: Array<{ value: ScholarMode; label: string; description: string; icon: typeof GraduationCap }> = [
  { value: "homework-helper", label: "Homework", description: "Hints and step-by-step explanations", icon: GraduationCap },
  { value: "research-assistant", label: "Research", description: "Find angles, sources, and structure", icon: BookOpen },
  { value: "essay-coach", label: "Essay", description: "Thesis, outline, revision, and polish", icon: FileText },
  { value: "flashcard-creator", label: "Flashcards", description: "Turn notes into memory practice", icon: Brain },
  { value: "note-summarizer", label: "Notes", description: "Clean summaries and study guides", icon: Sparkles },
  { value: "planner", label: "Planner", description: "Break deadlines into doable steps", icon: CalendarCheck }
];

const levels: Array<{ value: LearningLevel; label: string }> = [
  { value: "simple-student", label: "Simple Student" },
  { value: "high-school", label: "High School" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
  { value: "extremely-simplified", label: "Extra Simple" }
];

const starters = [
  "Explain this topic in simple steps: ",
  "Quiz me on the key ideas from: ",
  "Help me outline an essay about: ",
  "Make a study plan for: "
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ScholarChat() {
  const [mode, setMode] = useState<ScholarMode>("homework-helper");
  const [level, setLevel] = useState<LearningLevel>("high-school");
  const [humanize, setHumanize] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const body = useMemo(() => ({ mode, level, humanize }), [mode, level, humanize]);
  const selectedMode = modes.find((item) => item.value === mode) ?? modes[0];

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = { id: makeId(), role: "user", content: trimmed };
    const assistantId = makeId();
    const nextMessages = [...messages, userMessage];

    setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          messages: nextMessages.map(({ role, content }) => ({ role, content }))
        }),
        signal: controller.signal
      });

      if (!response.body) {
        const details = await response.text();
        throw new Error(details || "The chat response was empty.");
      }

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "The chat request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        assistantText += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content: assistantText } : message
          )
        );
      }

      assistantText += decoder.decode();
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: assistantText || "I could not generate a response. Try again in a moment." }
            : message
        )
      );
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError("Response stopped.");
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      }
      setMessages((current) => current.filter((message) => message.id !== assistantId));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function stopResponse() {
    abortRef.current?.abort();
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4">
        <header className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white/95 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-[var(--primary)] text-white">
              <BookOpen size={21} />
            </span>
            <div>
              <h1 className="text-xl font-semibold">ScholarAI</h1>
              <p className="text-sm text-[var(--muted-foreground)]">A focused study workspace for guided learning.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Learning level"
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
              value={level}
              onChange={(event) => setLevel(event.target.value as LearningLevel)}
            >
              {levels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-sm">
              <input checked={humanize} onChange={(event) => setHumanize(event.target.checked)} type="checkbox" />
              Natural writing
            </label>
            <Button asChild variant="ghost">
              <a href="/settings" aria-label="Settings">
                <Settings size={18} />
                Settings
              </a>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[286px_1fr]">
          <aside className="rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center gap-2 px-2 text-sm font-medium text-[var(--muted-foreground)]">
              <Menu size={16} />
              Study modes
            </div>
            <div className="grid gap-2">
              {modes.map((item) => (
                <button
                  key={item.value}
                  className={`flex min-h-14 items-start gap-3 rounded-md px-3 py-3 text-left text-sm transition ${
                    mode === item.value ? "bg-[#e4f4f0] text-[var(--primary)]" : "hover:bg-[var(--muted)]"
                  }`}
                  onClick={() => setMode(item.value)}
                  type="button"
                >
                  <item.icon className="mt-0.5 shrink-0" size={18} />
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[var(--muted-foreground)]">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-[var(--border)] bg-[#fbfcfc] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="text-[var(--primary)]" size={17} />
                Study guardrails
              </div>
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                ScholarAI gives hints, structure, and explanations so you can finish the work yourself.
              </p>
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col rounded-lg border border-[var(--border)] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <selectedMode.icon className="text-[var(--primary)]" size={19} />
                  <h2 className="font-semibold">{selectedMode.label} chat</h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ask for hints, explanations, outlines, summaries, flashcards, or a study plan.
                </p>
              </div>
              {isLoading ? (
                <Button onClick={stopResponse} type="button" variant="ghost">
                  Stop
                </Button>
              ) : null}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="grid h-full content-center gap-5">
                  <div className="mx-auto max-w-2xl text-center">
                    <span className="mx-auto mb-4 grid size-12 place-items-center rounded-md bg-[#e4f4f0] text-[var(--primary)]">
                      <Lightbulb size={23} />
                    </span>
                    <h3 className="text-2xl font-semibold">What are we learning today?</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      Start with a question, rough notes, an assignment prompt, or a topic you want explained.
                    </p>
                  </div>
                  <div className="mx-auto grid w-full max-w-3xl gap-2 sm:grid-cols-2">
                    {starters.map((starter) => (
                      <button
                        className="rounded-md border border-[var(--border)] bg-white p-3 text-left text-sm leading-6 shadow-sm transition hover:border-[var(--primary)] hover:bg-[#fbfcfc]"
                        key={starter}
                        onClick={() => setInput(starter)}
                        type="button"
                      >
                        <PenLine className="mb-2 text-[var(--primary)]" size={17} />
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-3xl whitespace-pre-wrap rounded-lg p-3 text-sm leading-6 ${
                      message.role === "user" ? "ml-auto bg-[var(--primary)] text-white" : "bg-[var(--muted)]"
                    }`}
                  >
                    {message.content || (
                      <span className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">
                        <Loader2 className="animate-spin" size={16} />
                        Thinking...
                      </span>
                    )}
                  </div>
                ))
              )}
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                  Something needs attention: {error}
                </div>
              ) : null}
            </div>

            <form className="flex gap-2 border-t border-[var(--border)] p-3" onSubmit={submitMessage}>
              <textarea
                aria-label="Message"
                className="max-h-36 min-h-12 flex-1 resize-none rounded-md border border-[var(--border)] px-3 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder="Ask for help learning, planning, researching, or revising..."
                value={input}
              />
              <Button className="h-12 self-end" disabled={isLoading || input.trim().length === 0} type="submit">
                <Send size={18} />
                Send
              </Button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
