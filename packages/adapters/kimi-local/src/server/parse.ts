import { asNumber, asString, parseJson, parseObject } from "@paperclipai/adapter-utils/server-utils";

export interface KimiStreamParseResult {
  sessionId: string | null;
  summary: string;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
  costUsd: number | null;
  errorMessage: string | null;
  assistantTexts: string[];
  thinkingTexts: string[];
  toolCalls: Array<{ id: string; name: string; arguments: string }>;
  toolResults: Array<{ toolCallId: string; content: string }>;
}

function extractContentText(content: unknown): string {
  const parts: string[] = [];
  if (!Array.isArray(content)) return "";
  for (const part of content) {
    const rec = parseObject(part);
    if (!rec) continue;
    const type = asString(rec.type, "");
    if (type === "text") {
      const text = asString(rec.text, "").trim();
      if (text) parts.push(text);
    }
  }
  return parts.join("\n").trim();
}

function extractThinkingText(content: unknown): string {
  const parts: string[] = [];
  if (!Array.isArray(content)) return "";
  for (const part of content) {
    const rec = parseObject(part);
    if (!rec) continue;
    const type = asString(rec.type, "");
    if (type === "think") {
      const text = asString(rec.think, "").trim();
      if (text) parts.push(text);
    }
  }
  return parts.join("\n").trim();
}

function extractToolCalls(event: Record<string, unknown>): Array<{ id: string; name: string; arguments: string }> {
  const calls: Array<{ id: string; name: string; arguments: string }> = [];
  const rawToolCalls = Array.isArray(event.tool_calls) ? event.tool_calls : [];
  for (const part of rawToolCalls) {
    const rec = parseObject(part);
    if (!rec) continue;
    const type = asString(rec.type, "");
    if (type !== "function") continue;
    const id = asString(rec.id, "");
    const fn = parseObject(rec.function);
    const name = asString(fn?.name, "");
    let args = "";
    if (typeof fn?.arguments === "string") {
      args = fn.arguments;
    } else if (fn?.arguments) {
      try {
        args = JSON.stringify(fn.arguments);
      } catch {
        args = "";
      }
    }
    if (id && name) calls.push({ id, name, arguments: args });
  }
  return calls;
}

function extractToolResultContent(content: unknown): string {
  const parts: string[] = [];
  if (!Array.isArray(content)) return "";
  for (const part of content) {
    const rec = parseObject(part);
    if (!rec) continue;
    const type = asString(rec.type, "");
    if (type === "text") {
      const text = asString(rec.text, "").trim();
      if (text) parts.push(text);
    } else if (type === "image") {
      parts.push("[image]");
    }
  }
  return parts.join("\n").trim();
}

export function parseKimiStreamJson(stdout: string): KimiStreamParseResult {
  let sessionId: string | null = null;
  const assistantTexts: string[] = [];
  const thinkingTexts: string[] = [];
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
  const toolResults: Array<{ toolCallId: string; content: string }> = [];
  let errorMessage: string | null = null;

  const lines = stdout.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Try parsing as JSON first
    const event = parseJson(line);
    if (event) {
      const role = asString(event.role, "");
      if (role === "assistant") {
        const content = event.content;
        const text = extractContentText(content);
        if (text) assistantTexts.push(text);
        const thinking = extractThinkingText(content);
        if (thinking) thinkingTexts.push(thinking);
        const calls = extractToolCalls(event);
        toolCalls.push(...calls);
      } else if (role === "tool") {
        const toolCallId = asString(event.tool_call_id, "");
        const content = event.content;
        const text = extractToolResultContent(content);
        if (toolCallId) {
          toolResults.push({ toolCallId, content: text });
        }
      }
      continue;
    }

    // Non-JSON line: check for session resume hint
    const sessionMatch = line.match(/To resume this session: kimi\s+-r\s+(\S+)/i);
    if (sessionMatch) {
      sessionId = sessionMatch[1] ?? null;
      continue;
    }

    // Check for error indicators in plain text
    if (/\berror\b|\bfatal\b|\bexception\b/i.test(line) && line.length < 500) {
      if (!errorMessage) errorMessage = line;
    }
  }

  const summary = assistantTexts.join("\n\n").trim();

  return {
    sessionId,
    summary,
    usage: { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 },
    costUsd: null,
    errorMessage,
    assistantTexts,
    thinkingTexts,
    toolCalls,
    toolResults,
  };
}

export function isKimiUnknownSessionError(stdout: string, stderr: string): boolean {
  const haystack = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return /session\s+not\s+found|unknown\s+session|invalid\s+session|conversation\s+not\s+found/i.test(haystack);
}
