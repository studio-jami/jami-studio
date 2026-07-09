# Agent Orchestration Research

Created: 2026-06-07

This folder is the early working notebook for using local CLI agents as delegated workers while Codex remains the final orchestrator for codebase truth, integration, and verification.

## Current Local Agent Set

- Codex: primary orchestrator, codebase source-of-truth reader, implementation owner for high-risk systems/backend work, final reviewer.
- Grok Build CLI: usable headless worker; good candidate for fast exploration, xAI/Grok-specific search/reasoning, alternate implementation sketches, and multi-candidate passes.
- Gemini CLI: usable headless worker; good candidate for web/search-heavy research, Google ecosystem tasks, long-context synthesis, and second-opinion audits.
- Claude Code CLI: installed and authenticated, but currently weekly-limit blocked until reset. Candidate for content/design/UI critique, prose, product language, and implementation review when quota is available.
- Hermes Agent: usable headless worker; currently configured around xAI OAuth and useful as a general research/conversation agent plus auth/proxy bridge.
- Agy / Antigravity CLI: installed and authenticated, but print mode currently returns empty stdout. It does generate responses into Antigravity transcripts, so it is not ready as a clean stdout worker yet.

## Working Principle

Use external agents for semantic labor and parallel viewpoints, not final authority. Codex should still verify the live repo, reconcile disagreements, patch files, run tests, and decide what lands.

## Files

- `cli-inventory.md`: tested commands, versions, config surfaces, and current health.
- `agy-debug-notes.md`: focused findings for the silent `agy --print` behavior.
- `orchestration-patterns.md`: first-pass delegation patterns and role split.
