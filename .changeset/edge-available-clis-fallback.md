---
"@agent-native/core": patch
---

Edge runtimes mount an empty-list `/_agent-native/available-clis` fallback in the core-routes plugin: the real endpoint lives in the Node-only terminal plugin which never ships to workerd, so every page load logged a console 404 from the agent panel's CLI feature probe. Node runtimes keep the terminal plugin's real handler.
