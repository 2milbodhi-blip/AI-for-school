export function streamPlainText(message: string, init?: ResponseInit) {
  return new Response(message, {
    ...init,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...init?.headers
    }
  });
}
