# Agy Debug Notes

Snapshot date: 2026-06-07

## Symptom

`agy --print` exits with status `0` but prints no final answer to stdout.

Repro:

```powershell
agy --print "Reply with exactly: agy ok" --print-timeout 120s
```

Observed:

- Exit code: `0`.
- Stdout: empty.
- Antigravity transcript contains the expected model response.

## Key Evidence

The current `agy` binary is:

```text
C:\Users\james\AppData\Local\agy\bin\agy.exe
```

Version:

```text
1.0.2
```

Relevant state/log root:

```text
C:\Users\james\.gemini\antigravity-cli
```

The successful response was found at:

```text
C:\Users\james\.gemini\antigravity-cli\brain\e23e04cc-0219-4e6a-974c-b15e47279b8b\.system_generated\logs\transcript.jsonl
```

Transcript content included:

```json
{"source":"MODEL","type":"PLANNER_RESPONSE","status":"DONE","content":"agy ok"}
```

The runtime log for the same call showed:

```text
Print mode: starting
Print mode: not authenticated, trying silent auth
ChainedAuth: authenticated via keyring
Print mode: silent auth succeeded
streamGenerateContent?alt=sse
Drip stopped: lastStepIdx=2, charIdx=6, length=6
```

That `length=6` matches `agy ok`, so generation happened and the missing part is stdout emission.

## What This Is Not

- Not a missing binary: `agy --version` and `agy --help` work.
- Not a complete auth failure: it initially logs "not logged in" but then silently authenticates through keyring.
- Not a symlink loop in copied skills: no reparse points were found under `C:\Users\james\.agents\skills` or `C:\Users\james\.gemini\skills`.
- Not imported plugin breakage: `agy plugin list` reports no imported plugins.

## Likely Cause

The CLI print-mode renderer appears to be failing to convert Antigravity planner responses into stdout final output. Logs also showed `PlannerResponse without ModifiedResponse encountered` in one run.

This may be an Antigravity print-mode bug or a mismatch between the selected model/agent response type and what the print-mode stdout path expects.

## Temporary Workaround

For experimentation, a wrapper could:

1. Run `agy --print "task" --print-timeout <duration>`.
2. Locate the newest transcript under:

```text
C:\Users\james\.gemini\antigravity-cli\brain\*\.system_generated\logs\transcript.jsonl
```

3. Extract the last `MODEL` event with `content`.

This is acceptable only for low-risk research. It is not clean enough for production orchestration because transcript selection can race if multiple `agy` sessions run concurrently.

## Next Debug Steps

- Test in a real repo root instead of `C:\Users\james\projects`.
- Try a model override if `agy` exposes one later; current help does not show a direct `--model`.
- Try after disabling Antigravity planner/tool behavior if a hidden setting exists.
- Check whether a newer `agy update` fixes print mode.
- If wrapping, force a unique prompt marker and read the newest transcript created after process start.

## Cleanup Note

A one-off debug log was created at `C:\Users\james\projects\agy-debug.log` during diagnosis and then deleted because it contained noisy auth/status diagnostics. Do not keep raw agent logs at the projects root.
