# OpenAI Model Reference (2025)

**Source:** OpenAI Platform Documentation
**Last Updated:** 2025-12-15

This document provides specific, current model IDs, constraints, and recommended defaults for implementing OpenAI API calls.

---

## Default Endpoint: Responses API

Use **Responses API** by default (`POST /v1/responses`) because it supports stateful interactions and advanced features (tools, etc.).

**Reference:** [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)

---

## 1. Default Model Choices (By Use Case)

### General-Purpose / Agentic / Best Overall (Default)

**Model:** `gpt-5.2`

- **Use for:** Complex reasoning, multi-step agentic tasks, coding
- **Context window:** 400,000 tokens
- **Max output:** 128,000 tokens
- **Reference:** [Using GPT-5.2](https://platform.openai.com/docs/guides/latest-model)

### Hard Problems (Extra Thinking Worth Latency)

**Model:** `gpt-5.2-pro`

- **Use for:** Problems requiring more compute; slower but more accurate
- **Responses API only**
- **Supports:** `reasoning.effort: medium|high|xhigh`
- **Context window:** 400,000 tokens
- **Max output:** 128,000 tokens
- **Reference:** [GPT-5.2 Pro Model](https://platform.openai.com/docs/models/gpt-5.2-pro)

### Cost-Optimized General Chat + Reasoning

**Model:** `gpt-5-mini`

- **Use for:** Faster, cheaper; good for well-defined tasks
- **Pricing (per 1M tokens):**
  - Input: $0.25
  - Cached input: $0.03
  - Output: $2.00
- **Context window:** 400,000 tokens
- **Max output:** 128,000 tokens
- **Snapshots:** `gpt-5-mini-2025-08-07` (use in production for reproducibility)
- **Reference:** [GPT-5 Mini Model](https://platform.openai.com/docs/models/gpt-5-mini)

### Ultra-High Throughput Simple Tasks

**Model:** `gpt-5-nano`

- **Use for:** Classification, extraction, routing
- **Pricing (per 1M tokens):**
  - Input: $0.05
  - Cached input: $0.01
  - Output: $0.40
- **Context window:** 400,000 tokens
- **Max output:** 128,000 tokens
- **Reference:** [GPT-5 Nano Model](https://platform.openai.com/docs/models/compare?model=gpt-5-nano)

### Agentic Coding Products / Codex Workflows

**Models:**

- `gpt-5.1-codex-max` (recommended for "interactive coding products"; supports function calling + structured outputs)
- `gpt-5.1-codex` (optimized for agentic coding; Responses API-only)

**Reference:** [GPT-5.1 Codex Model](https://platform.openai.com/docs/models/gpt-5.1-codex)

---

## 2. Reasoning Controls (CRITICAL Constraints)

### GPT-5.2 Family Uses `reasoning.effort`

**Recommended approach:** Start with `none` (low latency) and increase to `medium/high/xhigh` when needed.

**Reference:** [Using GPT-5.2](https://platform.openai.com/docs/guides/latest-model)

### Parameter Compatibility Constraint

**IMPORTANT:** For `gpt-5.2` (and `gpt-5.1`):

- `temperature`, `top_p`, and `logprobs` are **ONLY supported when `reasoning.effort` is `none`**
- If you pass these fields with any other reasoning effort, the request will **ERROR**
- This also applies to older GPT-5 models like `gpt-5-mini` / `gpt-5-nano`

**Reference:** [Using GPT-5.2](https://platform.openai.com/docs/guides/latest-model)

---

## 3. Model Snapshots vs Aliases

### Stability Strategy

- **Snapshots:** Date-stamped versions (e.g., `gpt-5-mini-2025-08-07`)
  - Use in production for reproducibility
- **Aliases:** Always point to latest version (e.g., `gpt-5-mini`)
  - Use for "always latest" behavior

**Example:** `gpt-5-mini` (alias) vs `gpt-5-mini-2025-08-07` (snapshot)

**Reference:** [GPT-5 Mini Model](https://platform.openai.com/docs/models/gpt-5-mini)

---

## 4. Specialized Model IDs

### Embeddings (Vector Search / Retrieval)

- `text-embedding-3-large` (most capable)
- `text-embedding-3-small` (smaller/cheaper)

**Reference:** [Vector Embeddings](https://platform.openai.com/docs/guides/embeddings)

### Image Generation (Text+Image → Image)

- `gpt-image-1` (state-of-the-art image model)
- Used automatically when using image-generation tool

**Reference:** [Image Generation](https://platform.openai.com/docs/guides/tools-image-generation)

### Moderation (Text + Image Safety Checks)

- `omni-moderation-latest`

**Reference:** [Omni-Moderation Model](https://platform.openai.com/docs/models/omni-moderation-latest)

### Speech / Transcription

- `Whisper` (transcription)
- `TTS-1` (text-to-speech)
- `TTS-1 HD` (high-quality text-to-speech)
- `GPT-4o Transcribe` (GPT-4o-powered transcription)
- `GPT-4o mini Transcribe` (cost-optimized transcription)
- `GPT-4o mini TTS` (cost-optimized text-to-speech)

**Reference:** [Models List](https://platform.openai.com/docs/models)

---

## 5. Programmatic Discovery

**Endpoint:** `GET https://api.openai.com/v1/models`

Use this at startup or in tooling to:
- Validate model availability
- Fail gracefully if model not available
- List all models available to your account

**Reference:** [List Models API](https://platform.openai.com/docs/api-reference/models/list)

---

## 6. Minimal Responses API Example

```bash
curl --request POST \
  --url https://api.openai.com/v1/responses \
  --header "Authorization: Bearer $OPENAI_API_KEY" \
  --header "Content-type: application/json" \
  --data '{
    "model": "gpt-5.2",
    "input": "Write a short plan for implementing X.",
    "reasoning": { "effort": "none" }
  }'
```

**Reference:** [Using GPT-5.2](https://platform.openai.com/docs/guides/latest-model)

---

## 7. Practical Selection Logic

### Implementation Guidelines

```typescript
// src/lib/openai-models.ts

export const MODELS = {
  // General-purpose (default)
  DEFAULT: 'gpt-5.2',

  // Cost-optimized
  MINI: 'gpt-5-mini',
  NANO: 'gpt-5-nano',

  // High-accuracy (slow)
  PRO: 'gpt-5.2-pro',

  // Coding
  CODEX: 'gpt-5.1-codex-max',
  CODEX_AGENTIC: 'gpt-5.1-codex',

  // Specialized
  EMBEDDING_LARGE: 'text-embedding-3-large',
  EMBEDDING_SMALL: 'text-embedding-3-small',
  IMAGE: 'gpt-image-1',
  MODERATION: 'omni-moderation-latest',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

export function selectModel(task: {
  type: 'chat' | 'code' | 'classification' | 'reasoning'
  priority: 'cost' | 'quality' | 'speed'
}): ModelId {
  if (task.type === 'code') {
    return MODELS.CODEX
  }

  if (task.type === 'classification') {
    return MODELS.NANO
  }

  if (task.type === 'reasoning' && task.priority === 'quality') {
    return MODELS.PRO
  }

  if (task.priority === 'cost') {
    return MODELS.MINI
  }

  // Default: general-purpose
  return MODELS.DEFAULT
}

export function buildRequest(
  model: ModelId,
  input: string,
  options?: {
    reasoningEffort?: 'none' | 'medium' | 'high' | 'xhigh'
    temperature?: number
    topP?: number
    maxTokens?: number
  }
) {
  const request: any = {
    model,
    input,
    reasoning: {
      effort: options?.reasoningEffort ?? 'none'
    }
  }

  // CRITICAL: Only add temperature/topP when reasoning effort is 'none'
  if (options?.reasoningEffort === 'none' || !options?.reasoningEffort) {
    if (options?.temperature !== undefined) {
      request.temperature = options.temperature
    }
    if (options?.topP !== undefined) {
      request.top_p = options.topP
    }
  }

  if (options?.maxTokens) {
    request.max_tokens = options.maxTokens
  }

  return request
}
```

### Decision Tree

1. **Default to `gpt-5.2`** for most text + coding + agent tasks
2. **Use `gpt-5-mini`** for cheaper "normal difficulty" tasks
3. **Use `gpt-5-nano`** for simple routing/classification at scale
4. **Escalate to `gpt-5.2-pro`** only when correctness matters more than latency
5. **For Codex-like agentic code editing**, prefer `gpt-5.1-codex-max` / `gpt-5.1-codex`
6. **If you set `reasoning.effort` ≠ `none`**, do **NOT** send `temperature/top_p/logprobs`

---

## Camp OS Model Usage

### For Camp OS Prototype

**Admin Config Assistant:**
- Model: `gpt-5.2` (default)
- Reasoning effort: `none` (we need speed, not deep reasoning)
- Use structured outputs for tool calling

**Parent Conversational Enrollment:**
- Model: `gpt-5-mini` (cost-optimized, good for guided conversations)
- Reasoning effort: `none`
- Multi-turn conversation with state management

**Staff Voice-to-Text Incident Reports:**
- Transcription: `Whisper` or `GPT-4o Transcribe`
- Structuring: `gpt-5-mini` (simple extraction task)

**Cost Control:**
- Implement rate limiting per user (max 10 requests/minute)
- Cache common responses (policies, FAQs)
- Monitor token usage with OpenAI Usage API

---

## References

- [Models Overview](https://platform.openai.com/docs/models)
- [Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Using GPT-5.2](https://platform.openai.com/docs/guides/latest-model)
- [Model Comparison](https://platform.openai.com/docs/models/compare)
- [List Models API](https://platform.openai.com/docs/api-reference/models/list)
