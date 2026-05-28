export const learningLevels = [
  "simple-student",
  "high-school",
  "college",
  "professional",
  "extremely-simplified"
] as const;

export const scholarModes = [
  "homework-helper",
  "research-assistant",
  "essay-coach",
  "flashcard-creator",
  "note-summarizer",
  "planner"
] as const;

export type LearningLevel = (typeof learningLevels)[number];
export type ScholarMode = (typeof scholarModes)[number];
