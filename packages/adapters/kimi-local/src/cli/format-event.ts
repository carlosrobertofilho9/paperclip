import pc from "picocolors";

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function extractTextParts(content: unknown): string[] {
  const texts: string[] = [];
  if (!Array.isArray(content)) return texts;
  for (const part of content) {
    const rec = asRecord(part);
    if (!rec) continue;
    if (asString(rec.type) === "text") {
      const text = asString(rec.text).trim();
      if (text) texts.push(text);
    }
  }
  return texts;
}

function extractThinkParts(content: unknown): string[] {
  const texts: string[] = [];
  if (!Array.isArray(content)) return texts;
  for (const part of content) {
    const rec = asRecord(part);
    if (!rec) continue;
    if (asString(rec.type) === "think") {
      const text = asString(rec.think).trim();
      if (text) texts.push(text);
    }
  }
  return texts;
}

export function printKimiStreamEvent(raw: string, _debug: boolean): void {
  const line = raw.trim();
  if (!line) return;

  const parsed = asRecord(safeJsonParse(line));
  if (!parsed) {
    if (/To resume this session:/i.test(line)) {
      console.log(pc.blue(line.trim()));
      return;
    }
    console.log(line);
    return;
  }

  const role = asString(parsed.role);

  if (role === "assistant") {
    const content = parsed.content;
    const thinks = extractThinkParts(content);
    const texts = extractTextParts(content);

    for (const text of thinks) {
      console.log(pc.gray(`thinking: ${text}`));
    }
    for (const text of texts) {
      console.log(pc.green(`assistant: ${text}`));
    }

    const rawToolCalls = Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [];
    for (const part of rawToolCalls) {
      const rec = asRecord(part);
      if (!rec) continue;
      if (asString(rec.type) !== "function") continue;
      const fn = asRecord(rec.function);
      const name = asString(fn?.name, "unknown");
      const id = asString(rec.id);
      console.log(pc.yellow(`tool_call: ${name}${id ? ` (${id})` : ""}`));
      if (fn?.arguments) {
        const args = typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments);
        console.log(pc.gray(args));
      }
    }
    return;
  }

  if (role === "tool") {
    const toolCallId = asString(parsed.tool_call_id);
    const content = extractTextParts(parsed.content).join("\n");
    const isError = content.includes("ERROR:");
    console.log((isError ? pc.red : pc.cyan)(`tool_result${isError ? " (error)" : ""}${toolCallId ? ` [${toolCallId}]` : ""}`));
    if (content) {
      console.log((isError ? pc.red : pc.gray)(content));
    }
    return;
  }

  console.log(line);
}
