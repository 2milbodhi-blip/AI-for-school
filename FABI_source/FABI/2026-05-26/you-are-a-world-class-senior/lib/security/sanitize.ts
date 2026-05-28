const SCRIPT_OR_STYLE = /<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/gi;
const HTML_TAG = /<[^>]*>/g;

export function sanitizeUserText(input: string) {
  return input
    .replace(SCRIPT_OR_STYLE, "")
    .replace(HTML_TAG, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, 8000);
}
