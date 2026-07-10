---
"@agent-native/core": patch
---

Fix the session-replay upload retry storm: a permanently-failing chunk upload (e.g. HTTP 400 from a misconfigured ingest endpoint) retried every flush interval forever from every open tab — a self-inflicted DoS on the ingest server — while failed batches accumulated without bound. `flushSessionReplay` now applies exponential backoff (5s base, 5min cap) to automatic flush triggers, keeps at most 10 failed batches, and trips a circuit breaker (recorder stopped, buffers dropped, one warning) after 3 consecutive non-transient 4xx failures or 10 consecutive failures of any cause. Explicit flushes (manual/retry/lifecycle) still attempt immediately.
