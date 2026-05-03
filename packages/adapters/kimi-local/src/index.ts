export const type = "kimi_local";
export const label = "Kimi (local)";

export const models = [
  { id: "kimi-code/kimi-for-coding", label: "Kimi K2.6 (for coding)" },
  { id: "kimi-code/kimi-for-coding-lite", label: "Kimi K2.6 Lite" },
];

export const agentConfigurationDoc = `# kimi_local agent configuration

Adapter: kimi_local

Use when:
- You want Paperclip to run Kimi CLI locally as the agent runtime
- You want Moonshot AI model inference via the kimi CLI
- You need session persistence across runs via --session

Don't use when:
- You need webhook-style external invocation (use openclaw_gateway or http)
- You only need one-shot shell commands (use process)
- The Kimi CLI is not installed on the machine

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process (created if missing when possible)
- instructionsFilePath (string, optional): absolute path to a markdown instructions file prepended to the run prompt
- model (string, optional): Kimi model id (for example kimi-code/kimi-for-coding)
- thinking (boolean, optional): enable thinking mode; defaults to true
- promptTemplate (string, optional): run prompt template
- command (string, optional): defaults to "kimi"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Runs are executed with: kimi --print --output-format stream-json --session <id> --prompt <prompt>
- Sessions are resumed with --session when stored session id matches.
- The adapter passes --print to run in non-interactive mode and auto-approves tool calls.
`;
