# CLI Agent Inventory

Snapshot date: 2026-06-07

## Summary

| Tool | Binary | Version | Headless prompt | Current status |
| --- | --- | --- | --- | --- |
| `grok` | `C:\Users\james\.grok\bin\grok.exe` | `0.2.32` | `grok -p "..."` | Works; one worker auth warning observed after success |
| `claude` | `C:\Users\james\.local\bin\claude.exe` | `2.1.163` | `claude -p "..."` | Authenticated, but weekly limit reached |
| `gemini` | fnm shim `gemini.ps1` | `0.41.2` | `gemini -p "..."` | Works; emits many duplicate skill conflict warnings |
| `agy` | `C:\Users\james\AppData\Local\agy\bin\agy.exe` | `1.0.2` | `agy --print "..."` | Model responds in transcript, but stdout is empty |
| `hermes` | `C:\Users\james\AppData\Local\hermes\hermes-agent\venv\Scripts\hermes.exe` | `0.16.0` | `hermes -z "..."` | Works |

## Smoke Tests

Commands that returned a usable direct answer:

```powershell
grok -p "Reply with exactly: grok ok" --max-turns 1 --no-subagents
gemini -p "Reply with exactly: gemini ok" --output-format text
hermes -z "Reply with exactly: hermes ok"
```

Claude command shape is correct, but quota blocked:

```powershell
claude -p "Reply with exactly: claude ok" --tools "" --no-session-persistence
```

Observed result:

```text
You've hit your weekly limit - resets 2pm (America/New_York)
```

Agy command shape starts a conversation but does not print final text:

```powershell
agy --print "Reply with exactly: agy ok" --print-timeout 120s
```

The response was found in the Antigravity transcript instead of stdout.

## Grok Build CLI

Useful commands:

```powershell
grok --version
grok --help
grok inspect
grok models
grok -p "task" --max-turns 1 --no-subagents
```

Capabilities from help:

- Headless single prompt: `-p` / `--single`.
- Prompt files and JSON content blocks: `--prompt-file`, `--prompt-json`.
- Built-in subagent support: `--agent`, `--agents`, `--no-subagents`.
- Parallel answer selection: `--best-of-n` in headless mode.
- Self-check loop: `--check` in headless mode.
- Worktree support: `--worktree`.
- Session continuation/resume/export.
- Model selection: `--model`.
- Permission controls: `--allow`, `--deny`, `--permission-mode`, `--sandbox`.

Observed config/capability notes:

- Logged in with `grok.com`.
- Default model is `grok-build`.
- Available models shown: `grok-build`, `grok-composer-2.5-fast`.
- `grok inspect` found 157 user skills, 3 built-in agents, 40 plugins, 2 MCP servers, and 6 hooks.
- Project trust for `C:\Users\james\projects` is currently `no`.

Best early use:

- Fast alternate reasoning pass.
- X/Grok-oriented search or trend sensing when available.
- `best-of-n` idea generation.
- Fresh audit pass on plans or implementation proposals.
- Not final code authority unless Codex verifies the patch.

## Claude Code CLI

Useful commands:

```powershell
claude --version
claude --help
claude auth status
claude -p "task" --tools "" --no-session-persistence
```

Capabilities from help:

- Headless output: `-p` / `--print`.
- Tool controls: `--tools`, `--allowedTools`, `--disallowedTools`.
- Agent controls: `--agent`, `--agents`, `claude agents`.
- Worktree support: `--worktree`.
- Session resume/continue.
- MCP config support.
- JSON and stream JSON output formats.
- Permission modes including `plan`, `auto`, and `bypassPermissions`.
- `ultrareview` for hosted multi-agent code review.

Observed status:

- Authenticated via `claude.ai`.
- Subscription type reported as `max`.
- Prompt execution is currently blocked by weekly limit until reset.

Best early use after reset:

- UI/content/design critique.
- Product copy and docs polish.
- Independent code review.
- Prose-heavy task decomposition.
- Design-system and frontend implementation sanity checks.

## Gemini CLI

Useful commands:

```powershell
gemini --version
gemini --help
gemini -p "task" --output-format text
gemini --list-extensions
gemini mcp --help
gemini skills --help
```

Capabilities from help:

- Headless prompt: `-p` / `--prompt`.
- Interactive-with-initial-prompt mode: `-i` / `--prompt-interactive`.
- Worktree support: `--worktree`.
- Sandbox and approval modes: `--sandbox`, `--approval-mode`.
- Policy files: `--policy`, `--admin-policy`.
- Session resume/list/delete.
- Extension and skill management.
- MCP management.
- JSON and stream JSON output.

Observed behavior:

- Headless prompt returned `gemini ok`.
- It emitted many duplicate skill conflict warnings because `C:\Users\james\.agents\skills` overrides same-named skills from `C:\Users\james\.gemini\skills`.
- No skill symlinks were found in `.agents\skills` or `.gemini\skills`; this is duplicate copied skill material, not a symlink loop.
- `rg` was unavailable inside Gemini's own runtime and it fell back to its grep tool.

Best early use:

- Web/search-heavy research.
- Google stack work.
- Long-context synthesis and plan critique.
- Secondary repo audit when warnings are acceptable.

## Agy / Antigravity CLI

Useful commands:

```powershell
agy --version
agy --help
agy --print "task" --print-timeout 120s
agy plugin list
```

Capabilities from help:

- Headless print mode: `--print`, `-p`, `--prompt`.
- Interactive initial prompt: `--prompt-interactive`, `-i`.
- Continue/resume conversation.
- Add workspace directories: `--add-dir`.
- Sandbox mode.
- Permission skip option.
- Plugin install/list/enable/disable/update.

Observed status:

- Version `1.0.2`.
- `plugin list` reports no imported plugins.
- Auth silently succeeds through keyring after initial "not logged in" startup noise.
- Model response appears in Antigravity transcript logs, but stdout remains empty.

Best early use:

- Hold until stdout issue is fixed or wrap it with transcript extraction.
- If wrapped, use for Google Antigravity-specific agent comparison and low-risk semantic tasks.

## Hermes Agent

Useful commands:

```powershell
hermes --version
hermes --help
hermes status
hermes -z "task"
hermes proxy status
hermes sessions list
```

Capabilities from help:

- One-shot final response: `-z` / `--oneshot`.
- Model/provider override: `--model`, `--provider`.
- Toolset selection: `--toolsets`.
- Worktree support.
- Skill preload: `--skills`.
- Session resume/continue.
- Auth/provider management.
- Proxy and gateway commands.
- Messaging platform integrations.
- Dashboard, logs, doctor, MCP, memory, and security commands.

Observed status:

- Version `0.16.0`.
- One-shot returned `hermes ok`.
- Configured provider is xAI Grok OAuth with model `grok-4.3`.
- Hermes has useful auth/proxy surfaces, including xAI OAuth and OpenAI Codex auth.
- Nous Tool Gateway currently has no usable paid credits.

Best early use:

- General research/conversation worker.
- Auth/proxy bridge for xAI/Grok flows.
- Experimental workflows where Hermes skills/toolsets matter.
- Long-lived helper sessions or dashboard-backed workflows.

## Secret Hygiene

Do not paste raw `settings.json`, auth files, or full status output into docs or prompts. Some local settings include tokens or short-lived credentials. Capture capability state, not secret values.
