"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Link2,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LearningLevel, ScholarMode } from "@/features/ai/types";

type View = "overview" | "chat" | "planner" | "notes" | "flashcards" | "files" | "research";
type TaskStatus = "todo" | "doing" | "done";
type Priority = "low" | "medium" | "high";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StudyTask = {
  id: string;
  title: string;
  subject: string;
  due: string;
  priority: Priority;
  status: TaskStatus;
};

type StudyNote = {
  id: string;
  title: string;
  body: string;
  tag: string;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
};

type ResearchSource = {
  id: string;
  title: string;
  url: string;
  note: string;
};

const views: Array<{ value: View; label: string; icon: typeof LayoutDashboard }> = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "chat", label: "AI Tutor", icon: MessageSquareText },
  { value: "planner", label: "Planner", icon: CalendarCheck },
  { value: "notes", label: "Notes", icon: FileText },
  { value: "flashcards", label: "Flashcards", icon: Brain },
  { value: "files", label: "Files", icon: Upload },
  { value: "research", label: "Research", icon: Search }
];

const modes: Array<{ value: ScholarMode; label: string; description: string; icon: typeof GraduationCap }> = [
  { value: "homework-helper", label: "Homework", description: "Hints and guided explanations", icon: GraduationCap },
  { value: "research-assistant", label: "Research", description: "Angles, sources, and structure", icon: BookOpen },
  { value: "essay-coach", label: "Essay", description: "Thesis, outline, and revision", icon: FileText },
  { value: "flashcard-creator", label: "Flashcards", description: "Memory practice from notes", icon: Brain },
  { value: "note-summarizer", label: "Notes", description: "Summaries and study guides", icon: Sparkles },
  { value: "planner", label: "Planner", description: "Break work into steps", icon: CalendarCheck }
];

const levels: Array<{ value: LearningLevel; label: string }> = [
  { value: "simple-student", label: "Simple Student" },
  { value: "high-school", label: "High School" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
  { value: "extremely-simplified", label: "Extra Simple" }
];

const starterTasks: StudyTask[] = [
  { id: "task-1", title: "Review biology notes", subject: "Biology", due: "Today", priority: "high", status: "doing" },
  { id: "task-2", title: "Outline history essay", subject: "History", due: "Tomorrow", priority: "medium", status: "todo" },
  { id: "task-3", title: "Practice algebra problems", subject: "Math", due: "Friday", priority: "medium", status: "done" }
];

const starterNotes: StudyNote[] = [
  {
    id: "note-1",
    title: "Cell respiration",
    tag: "Biology",
    body: "Glucose breaks down through glycolysis, Krebs cycle, and electron transport to release ATP."
  },
  {
    id: "note-2",
    title: "Essay thesis pattern",
    tag: "Writing",
    body: "A strong thesis names the topic, takes a position, and previews the main reasons."
  }
];

const starterCards: Flashcard[] = [
  { id: "card-1", front: "What does ATP store?", back: "Usable cellular energy.", mastered: false },
  { id: "card-2", front: "What makes a source credible?", back: "Authority, evidence, date, purpose, and transparency.", mastered: true }
];

const starterSources: ResearchSource[] = [
  {
    id: "source-1",
    title: "Source credibility checklist",
    url: "https://example.com/source-checklist",
    note: "Use CRAAP-style checks before saving quotes or facts."
  }
];

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getChatErrorMessage(caught: unknown) {
  if (caught instanceof DOMException && caught.name === "AbortError") {
    return "Response stopped.";
  }

  if (caught instanceof TypeError) {
    return "Network error: ScholarAI could not reach /api/chat. Check that the dev server is running and try again.";
  }

  return caught instanceof Error ? caught.message : "Something went wrong.";
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary"
}: {
  label: string;
  value: string;
  icon: typeof LayoutDashboard;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <span
          className={`grid size-9 place-items-center rounded-md ${
            tone === "accent" ? "bg-[#fff4d2] text-[#8a650b]" : "bg-[#e4f4f0] text-[var(--primary)]"
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  children
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ScholarWorkspace() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [mode, setMode] = useState<ScholarMode>("homework-helper");
  const [level, setLevel] = useState<LearningLevel>("high-school");
  const [humanize, setHumanize] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>(starterTasks);
  const [notes, setNotes] = useState<StudyNote[]>(starterNotes);
  const [cards, setCards] = useState<Flashcard[]>(starterCards);
  const [sources, setSources] = useState<ResearchSource[]>(starterSources);
  const [fileNotes, setFileNotes] = useState<string[]>(["Drop class materials here later, then summarize them with ScholarAI."]);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTasks(readStored("scholarai:tasks", starterTasks));
    setNotes(readStored("scholarai:notes", starterNotes));
    setCards(readStored("scholarai:cards", starterCards));
    setSources(readStored("scholarai:sources", starterSources));
    setFileNotes(readStored("scholarai:fileNotes", ["Drop class materials here later, then summarize them with ScholarAI."]));
  }, []);

  useEffect(() => window.localStorage.setItem("scholarai:tasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => window.localStorage.setItem("scholarai:notes", JSON.stringify(notes)), [notes]);
  useEffect(() => window.localStorage.setItem("scholarai:cards", JSON.stringify(cards)), [cards]);
  useEffect(() => window.localStorage.setItem("scholarai:sources", JSON.stringify(sources)), [sources]);
  useEffect(() => window.localStorage.setItem("scholarai:fileNotes", JSON.stringify(fileNotes)), [fileNotes]);

  const selectedMode = modes.find((item) => item.value === mode) ?? modes[0];
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const openTasks = tasks.length - doneCount;
  const masteredCards = cards.filter((card) => card.mastered).length;
  const body = useMemo(() => ({ mode, level, humanize }), [mode, level, humanize]);

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = { id: makeId("msg"), role: "user", content: trimmed };
    const assistantId = makeId("msg");
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

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `The chat request failed with status ${response.status}.`);
      }

      if (!response.body) {
        throw new Error("The chat response was empty.");
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
          current.map((message) => (message.id === assistantId ? { ...message, content: assistantText } : message))
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
      console.error("[chat:client]", caught);
      setError(getChatErrorMessage(caught));
      setMessages((current) => current.filter((message) => message.id !== assistantId));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) {
      return;
    }

    setTasks((current) => [
      { id: makeId("task"), title: taskTitle.trim(), subject: "General", due: "This week", priority: "medium", status: "todo" },
      ...current
    ]);
    setTaskTitle("");
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) {
      return;
    }

    setNotes((current) => [
      { id: makeId("note"), title: noteTitle.trim(), body: noteBody.trim(), tag: "Study" },
      ...current
    ]);
    setNoteTitle("");
    setNoteBody("");
  }

  function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) {
      return;
    }

    setCards((current) => [
      { id: makeId("card"), front: cardFront.trim(), back: cardBack.trim(), mastered: false },
      ...current
    ]);
    setCardFront("");
    setCardBack("");
  }

  function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sourceTitle.trim()) {
      return;
    }

    setSources((current) => [
      { id: makeId("source"), title: sourceTitle.trim(), url: sourceUrl.trim(), note: "Needs credibility check and citation details." },
      ...current
    ]);
    setSourceTitle("");
    setSourceUrl("");
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  function removeItem<T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) {
    setter((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 px-4 py-4">
        <aside className="hidden w-64 shrink-0 flex-col rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm lg:flex">
          <div className="mb-5 flex items-center gap-3 px-2 py-2">
            <span className="grid size-10 place-items-center rounded-md bg-[var(--primary)] text-white">
              <BookOpen size={20} />
            </span>
            <div>
              <p className="font-semibold">ScholarAI</p>
              <p className="text-xs text-[var(--muted-foreground)]">Study workspace</p>
            </div>
          </div>

          <nav className="grid gap-1">
            {views.map((view) => (
              <button
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                  activeView === view.value ? "bg-[#e4f4f0] text-[var(--primary)]" : "hover:bg-[var(--muted)]"
                }`}
                key={view.value}
                onClick={() => setActiveView(view.value)}
                type="button"
              >
                <view.icon size={18} />
                {view.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-md border border-[var(--border)] bg-[#fbfcfc] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="text-[var(--primary)]" size={17} />
              Focus mode
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              Keep tasks, notes, research, and AI help in one calm workspace.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Welcome back</p>
                <h1 className="text-2xl font-semibold">Your ScholarAI command center</h1>
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
                  <a href="/settings">
                    <Settings size={18} />
                    Settings
                  </a>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {views.map((view) => (
                <button
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm ${
                    activeView === view.value
                      ? "border-[var(--primary)] bg-[#e4f4f0] text-[var(--primary)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                  key={view.value}
                  onClick={() => setActiveView(view.value)}
                  type="button"
                >
                  <view.icon size={16} />
                  {view.label}
                </button>
              ))}
            </div>
          </header>

          {activeView === "overview" ? (
            <div className="grid gap-4">
              <section className="grid gap-4 md:grid-cols-4">
                <StatCard icon={ClipboardList} label="Open tasks" value={String(openTasks)} />
                <StatCard icon={FileText} label="Saved notes" value={String(notes.length)} />
                <StatCard icon={Brain} label="Mastered cards" value={`${masteredCards}/${cards.length}`} tone="accent" />
                <StatCard icon={Library} label="Research sources" value={String(sources.length)} />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
                <Panel
                  title="Today's study flow"
                  action={
                    <Button onClick={() => setActiveView("chat")} type="button" variant="ghost">
                      Ask AI
                      <ChevronRight size={17} />
                    </Button>
                  }
                >
                  <div className="grid gap-3">
                    {tasks.slice(0, 4).map((task) => (
                      <div className="flex items-center gap-3 rounded-md bg-[var(--muted)] p-3" key={task.id}>
                        <span className="grid size-8 place-items-center rounded-md bg-white text-[var(--primary)]">
                          {task.status === "done" ? <Check size={17} /> : <CalendarCheck size={17} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {task.subject} - {task.due} - {task.priority}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Quick launch">
                  <div className="grid gap-2">
                    {views.slice(1).map((view) => (
                      <button
                        className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white p-3 text-left text-sm transition hover:border-[var(--primary)] hover:bg-[#fbfcfc]"
                        key={view.value}
                        onClick={() => setActiveView(view.value)}
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <view.icon className="text-[var(--primary)]" size={18} />
                          {view.label}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </Panel>
              </section>
            </div>
          ) : null}

          {activeView === "chat" ? (
            <section className="grid min-h-[720px] gap-4 xl:grid-cols-[280px_1fr]">
              <Panel title="Study modes">
                <div className="grid gap-2">
                  {modes.map((item) => (
                    <button
                      className={`flex min-h-14 items-start gap-3 rounded-md px-3 py-3 text-left text-sm transition ${
                        mode === item.value ? "bg-[#e4f4f0] text-[var(--primary)]" : "hover:bg-[var(--muted)]"
                      }`}
                      key={item.value}
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
              </Panel>

              <section className="flex min-h-[720px] flex-col rounded-lg border border-[var(--border)] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <selectedMode.icon className="text-[var(--primary)]" size={19} />
                      <h2 className="font-semibold">{selectedMode.label} chat</h2>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">Ask for help learning, planning, researching, or revising.</p>
                  </div>
                  {isLoading ? (
                    <Button onClick={() => abortRef.current?.abort()} type="button" variant="ghost">
                      Stop
                    </Button>
                  ) : null}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="grid h-full content-center gap-4 text-center">
                      <span className="mx-auto grid size-12 place-items-center rounded-md bg-[#e4f4f0] text-[var(--primary)]">
                        <Sparkles size={23} />
                      </span>
                      <div>
                        <h3 className="text-2xl font-semibold">What are we learning today?</h3>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                          Paste a prompt, rough notes, a topic, or a deadline and ScholarAI will help you work through it.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        className={`max-w-3xl whitespace-pre-wrap rounded-lg p-3 text-sm leading-6 ${
                          message.role === "user" ? "ml-auto bg-[var(--primary)] text-white" : "bg-[var(--muted)]"
                        }`}
                        key={message.id}
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
                  {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
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
                    placeholder="Ask ScholarAI..."
                    value={input}
                  />
                  <Button className="h-12 self-end" disabled={isLoading || input.trim().length === 0} type="submit">
                    <Send size={18} />
                    Send
                  </Button>
                </form>
              </section>
            </section>
          ) : null}

          {activeView === "planner" ? (
            <Panel title="Planner">
              <form className="mb-4 flex gap-2" onSubmit={addTask}>
                <input
                  className="h-11 flex-1 rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Add a study task..."
                  value={taskTitle}
                />
                <Button type="submit">
                  <Plus size={18} />
                  Add
                </Button>
              </form>
              <div className="grid gap-3">
                {tasks.map((task) => (
                  <div className="grid gap-3 rounded-md border border-[var(--border)] p-3 md:grid-cols-[1fr_auto]" key={task.id}>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {task.subject} - due {task.due} - {task.priority} priority
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
                        <button
                          className={`h-9 rounded-md border px-3 text-xs ${
                            task.status === status ? "border-[var(--primary)] bg-[#e4f4f0] text-[var(--primary)]" : "border-[var(--border)]"
                          }`}
                          key={status}
                          onClick={() => updateTaskStatus(task.id, status)}
                          type="button"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {activeView === "notes" ? (
            <Panel title="Notes">
              <form className="mb-4 grid gap-2" onSubmit={addNote}>
                <input
                  className="h-11 rounded-md border border-[var(--border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  onChange={(event) => setNoteTitle(event.target.value)}
                  placeholder="Note title"
                  value={noteTitle}
                />
                <textarea
                  className="min-h-24 rounded-md border border-[var(--border)] px-3 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  onChange={(event) => setNoteBody(event.target.value)}
                  placeholder="Paste class notes or write a summary..."
                  value={noteBody}
                />
                <Button className="w-fit" type="submit">
                  <Plus size={18} />
                  Save note
                </Button>
              </form>
              <div className="grid gap-3 md:grid-cols-2">
                {notes.map((note) => (
                  <article className="rounded-md border border-[var(--border)] p-4" key={note.id}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{note.tag}</p>
                      </div>
                      <button onClick={() => removeItem(setNotes, note.id)} type="button" aria-label="Delete note">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">{note.body}</p>
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}

          {activeView === "flashcards" ? (
            <Panel title="Flashcards">
              <form className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={addCard}>
                <input className="h-11 rounded-md border border-[var(--border)] px-3" onChange={(event) => setCardFront(event.target.value)} placeholder="Question" value={cardFront} />
                <input className="h-11 rounded-md border border-[var(--border)] px-3" onChange={(event) => setCardBack(event.target.value)} placeholder="Answer" value={cardBack} />
                <Button type="submit">
                  <Plus size={18} />
                  Add
                </Button>
              </form>
              <div className="grid gap-3 md:grid-cols-2">
                {cards.map((card) => (
                  <article className="rounded-md border border-[var(--border)] bg-[#fbfcfc] p-4" key={card.id}>
                    <p className="text-sm font-medium">{card.front}</p>
                    <p className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-[var(--muted-foreground)]">{card.back}</p>
                    <Button className="mt-3" onClick={() => setCards((current) => current.map((item) => (item.id === card.id ? { ...item, mastered: !item.mastered } : item)))} type="button" variant={card.mastered ? "secondary" : "ghost"}>
                      <Check size={17} />
                      {card.mastered ? "Mastered" : "Mark mastered"}
                    </Button>
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}

          {activeView === "files" ? (
            <Panel title="Files and class materials">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[#fbfcfc] p-6 text-center">
                  <div>
                    <span className="mx-auto grid size-12 place-items-center rounded-md bg-[#e4f4f0] text-[var(--primary)]">
                      <Upload size={23} />
                    </span>
                    <h3 className="mt-4 font-semibold">Upload support is ready for the next Supabase step</h3>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
                      The database already has an uploaded files table. This screen is the front-end landing zone for PDFs, docs, images, and extracted text.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <h3 className="font-medium">File workflow notes</h3>
                  <div className="mt-3 grid gap-2">
                    {fileNotes.map((note) => (
                      <div className="rounded-md bg-[var(--muted)] p-3 text-sm leading-6" key={note}>
                        {note}
                      </div>
                    ))}
                  </div>
                  <Button className="mt-3" onClick={() => setFileNotes((current) => ["Add Supabase Storage bucket and parser route.", ...current])} type="button" variant="ghost">
                    <Plus size={18} />
                    Add next step
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeView === "research" ? (
            <Panel title="Research assistant">
              <form className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={addSource}>
                <input className="h-11 rounded-md border border-[var(--border)] px-3" onChange={(event) => setSourceTitle(event.target.value)} placeholder="Source title" value={sourceTitle} />
                <input className="h-11 rounded-md border border-[var(--border)] px-3" onChange={(event) => setSourceUrl(event.target.value)} placeholder="URL" value={sourceUrl} />
                <Button type="submit">
                  <Plus size={18} />
                  Save
                </Button>
              </form>
              <div className="grid gap-3">
                {sources.map((source) => (
                  <article className="rounded-md border border-[var(--border)] p-4" key={source.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{source.title}</p>
                        <p className="mt-1 flex items-center gap-2 break-all text-sm text-[var(--primary)]">
                          <Link2 size={15} />
                          {source.url || "No URL saved yet"}
                        </p>
                      </div>
                      <button onClick={() => removeItem(setSources, source.id)} type="button" aria-label="Delete source">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{source.note}</p>
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}
        </section>
      </div>
    </main>
  );
}
