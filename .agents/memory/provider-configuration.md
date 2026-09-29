---
name: Provider configuration
description: The LMS uses user-owned provider keys and must keep them server-side.
---

Provider access is configured with workspace secrets for Gemini, OpenAI, and DeepSeek; browser code must only receive availability, selection, and model metadata. The selected provider is persisted by the app so generation behavior survives reloads.

**Why:** Managed Gemini access required an account upgrade that the user declined, so retrying that setup would not help.

**How to apply:** Keep provider calls in the API server, never expose key values in generated client code, and treat missing provider keys as explicit availability states.