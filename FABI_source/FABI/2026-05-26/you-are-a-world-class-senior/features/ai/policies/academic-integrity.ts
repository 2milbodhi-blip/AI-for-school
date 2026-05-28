const CHEATING_PATTERNS = [
  /\b(write|do|finish|complete)\s+(my|this)\s+(essay|paper|assignment|homework|discussion post)\b/i,
  /\b(give me|send me|tell me)\s+(the\s+)?answers?\b/i,
  /\b(take|solve)\s+(my|this)\s+(test|quiz|exam)\b/i,
  /\bmake it (undetectable|not detectable|bypass plagiarism|bypass ai detection)\b/i,
  /\b(plagiarize|copy this and submit|turn this in as mine)\b/i
];

export type IntegrityResult = {
  allowed: boolean;
  reason?: string;
  redirect: string;
};

export function checkAcademicIntegrity(input: string): IntegrityResult {
  const matched = CHEATING_PATTERNS.find((pattern) => pattern.test(input));

  if (!matched) {
    return {
      allowed: true,
      redirect: ""
    };
  }

  return {
    allowed: false,
    reason: "The request appears to ask ScholarAI to complete or hide schoolwork dishonestly.",
    redirect:
      "I can help you learn this fairly. I can make an outline, explain the concept, review your draft, create practice questions, or walk through the first example with you."
  };
}
