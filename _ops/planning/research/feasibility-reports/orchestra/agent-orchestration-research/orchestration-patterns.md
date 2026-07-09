# Orchestration Patterns

Snapshot date: 2026-06-07

## Role Split

Codex remains the primary orchestrator:

- Read the real repo and durable docs first.
- Decide which agents should handle semantic or exploratory work.
- Keep delegated tasks narrow and evidence-producing.
- Reconcile outputs against live code, tests, and local contracts.
- Make final edits, run verification, and write the final answer.

Other agents are workers:

- They can research, critique, draft, compare, and propose.
- They should not be treated as source of truth.
- Their outputs should include commands run, files read, assumptions, and confidence.
- Their work should be disposable unless Codex verifies it.

## Early Routing Matrix

| Work type | Best first delegate | Notes |
| --- | --- | --- |
| Live repo implementation | Codex | Especially backend, contracts, migrations, auth, runtime correctness |
| Alternate implementation ideas | Grok or Gemini | Ask for risks and minimal patch shape, not final code |
| Search/trend/web context | Gemini, Grok | Gemini for web/Google ecosystem; Grok for xAI/X-oriented angles |
| UI critique and product language | Claude after reset | Keep Codex responsible for actual integration and responsive verification |
| Prose/docs refinement | Claude or Hermes | Codex checks for repo truth and secret hygiene |
| Research conversation | Hermes | Especially when Hermes provider/proxy context is useful |
| Google/Antigravity experiments | Agy after stdout fix | For now, transcript extraction only |
| Parallel audit | Grok, Gemini, Claude | Give each a bounded checklist and compare disagreements |

## Delegation Prompt Shape

Use short, bounded tasks:

```text
You are a delegated review agent. Do not edit files.
Task: inspect <specific files/area> for <specific risk>.
Return:
1. Findings with file/line references.
2. Evidence commands or files read.
3. Unknowns.
4. Suggested next action.
```

For implementation sketches:

```text
Do not write files. Propose the smallest patch plan for <goal>.
Ground the answer in the current code paths listed below.
Call out where you are uncertain.
```

For research:

```text
Research <question>. Prefer primary sources.
Return concise bullets with links, dates, and confidence.
Do not speculate beyond the evidence.
```

## Local Command Patterns

Grok:

```powershell
grok -p "<prompt>" --max-turns 1 --no-subagents
grok -p "<prompt>" --best-of-n 3 --check --max-turns 3
```

Gemini:

```powershell
gemini -p "<prompt>" --output-format text --approval-mode plan
```

Claude:

```powershell
claude -p "<prompt>" --tools "" --no-session-persistence
claude -p "<prompt>" --permission-mode plan --no-session-persistence
```

Hermes:

```powershell
hermes -z "<prompt>"
hermes -z "<prompt>" --provider xai --model grok-4.3
```

Agy, currently experimental:

```powershell
agy --print "<prompt>" --print-timeout 120s
```

Then inspect the newest transcript under `C:\Users\james\.gemini\antigravity-cli\brain`.

## Guardrails

- Keep prompts explicit about read-only versus edit authority.
- Avoid giving multiple agents write access to the same tree at the same time.
- Prefer isolated git worktrees for true parallel implementation.
- Never pass raw local auth/config files into another agent.
- Do not paste secrets from status/config output.
- Treat generated plans as hypotheses until Codex checks live code.
- Capture agent outputs in docs only after removing tokens, emails if unnecessary, and transient auth details.

## Goal.md Context

Several existing project `goal.md` files already encode the useful parent-agent pattern: parent coordinates, short-lived workers inspect or execute, and final status is based on verified repo evidence. This folder should evolve toward a reusable cross-agent version of that pattern without weakening repo-specific rules.

Good source examples to revisit later:

- `C:\Users\james\projects\daily-briefs\docs\user-notes\goal.md`
- `C:\Users\james\projects\upscaler\docs\user-notes\goal.md`
- `C:\Users\james\projects\zavi\docs\user-notes\goal.md`
- `C:\Users\james\projects\Modal` roadmap and orchestration docs

## Next Practical Steps

- Build a tiny PowerShell harness that runs `grok`, `gemini`, `hermes`, and eventually `claude` with a shared prompt and captures outputs into timestamped files.
- Add per-agent prompt templates for audit, research, prose, and implementation-sketch modes.
- Decide whether `agy` is worth wrapping via transcript extraction or should wait for a CLI update.
- Add a "delegate then verify" checklist that can be pasted into repo `goal.md` files.
