---
"@agent-native/core": patch
---

ssrfSafeFetch trusts the deployment's OWN configured origins (APP_URL, BETTER_AUTH_URL, WEBHOOK_BASE_URL, WORKSPACE_GATEWAY_URL, workspace app manifest URLs). These are operator configuration, not user input, so a fetch to them is a self-call — the private-address guard was blocking every workspace-internal A2A call (call-agent to a sibling app) on local dev and self-hosted private networks. Only exact origin matches are trusted; redirect hops are still re-validated, so a trusted origin cannot 30x into the private network, and the default posture with no configured origins is unchanged.
