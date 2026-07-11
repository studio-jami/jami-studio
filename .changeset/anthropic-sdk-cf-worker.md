---
"@agent-native/core": patch
---

Cloudflare worker bundles the real @anthropic-ai/sdk instead of an empty-class stub. The SDK is pure fetch-based JS that runs on workerd, and the BYOK Anthropic agent engine constructs it at runtime — the stub made every agent chat run on a Cloudflare deployment die with "Cannot read properties of undefined (reading 'stream')". The WASM tokenizer stays stubbed (token counts degrade to estimates).
