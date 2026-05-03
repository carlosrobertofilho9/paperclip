import type { TranscriptEntry } from "@paperclipai/adapter-utils";

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

function extractToolCalls(event: Record<string, unknown>): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const rawToolCalls = Array.isArray(event.tool_calls) ? event.tool_calls : [];
  for (const part of rawToolCalls) {
    const rec = asRecord(part);
    if (!rec) continue;
    if (asString(rec.type) !== "function") continue;
    const id = asString(rec.id);
    const fn = asRecord(rec.function);
    const name = asString(fn?.name, "unknown");
    let input: Record<string, unknown> = {};
    if (typeof fn?.arguments === "string") {
      try {
        input = JSON.parse(fn.arguments);
      } catch {
        input = { raw: fn.arguments };
      }
    } else if (fn?.arguments) {
      input = asRecord(fn.arguments) ?? {};
    }
    if (id) {
      entries.push({
        kind: "tool_call",
        ts: "",
        name,
        toolUseId: id,
        input,
      });
    }
  }
  return entries;
}

function extractToolResultContent(content: unknown): string {
  const parts: string[] = [];
  if (!Array.isArray(content)) return "";
  for (const part of content) {
    const rec = asRecord(part);
    if (!rec) continue;
    if (asString(rec.type) === "text") {
      const text = asString(rec.text).trim();
      if (text) parts.push(text);
    }
  }
  return parts.join("\n").trim();
}

export function parseKimiStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = asRecord(safeJsonParse(line));
  if (!parsed) {
    // Check for session resume hint
    if (/To resume this session:/i.test(line)) {
      return [{ kind: "system", ts, text: line.trim() }];
    }
    return [{ kind: "stdout", ts, text: line }];
  }

  const role = asString(parsed.role);

  if (role === "assistant") {
    const entries: TranscriptEntry[] = [];
    const content = parsed.content;
    const texts = extractTextParts(content);
    const thinks = extractThinkParts(content);

    for (const text of thinks) {
      entries.push({ kind: "thinking", ts, text });
    }
    for (const text of texts) {
      entries.push({ kind: "assistant", ts, text });
    }

    const toolCalls = extractToolCalls(parsed);
    entries.push(...toolCalls);

    if (entries.length === 0) {
      return [{ kind: "stdout", ts, text: line }];
    }
    return entries;
  }

  if (role === "tool") {
    const toolCallId = asString(parsed.tool_call_id, "");
    const content = extractToolResultContent(parsed.content);
    const isError = typeof content === "string" && content.includes("ERROR:");
    if (toolCallId) {
      return [{
        kind: "tool_result",
        ts,
        toolUseId: toolCallId,
        content,
        isError,
      }];
    }
    return [{ kind: "stdout", ts, text: line }];
  }

  return [{ kind: "stdout", ts, text: line }];
}
