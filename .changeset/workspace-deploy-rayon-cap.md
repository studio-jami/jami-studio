---
"@agent-native/core": patch
---

workspace-deploy: cap rolldown's rayon thread pool on Windows (RAYON_NUM_THREADS=2 unless overridden). The native thread pool has a race that kills app builds with an access violation (0xC0000005) — intermittently for most apps, deterministically for some (chat under cloudflare_pages). Capping the pool eliminates the crash; combined with the native-crash retry this makes unified workspace builds reliable on Windows.
