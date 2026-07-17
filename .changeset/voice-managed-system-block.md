---
"@agent-native/core": patch
---

ElevenLabs voice: durable managed system block in the agent prompt. The voice bridge now composes a sentinel-delimited, code-owned system contract (never self-initiate actions, headless answers, narrate delegated work, navigation only on explicit intent) beneath the user's dashboard personality text at session mint, self-healing if deleted or stale while preserving every dashboard-owned setting (personality, voice, name, LLM, language, TTS). Apps can contribute a bounded app-context addendum via the existing `instructions`/`getInstructions` mount options.
