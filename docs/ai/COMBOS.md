# Recommended 9Router Combos

Create these combo IDs exactly, or update the `model:` field in the agent files to match your chosen names.

## `Analysis`

For BA, PM, architecture, and planning.

Recommended fallback order:

1. `kr/claude-sonnet-4.5-thinking`
2. `cx/gpt-5.5`
3. `kr/glm-5-thinking`
4. `kr/deepseek-3.2-thinking`

## `Implementation`

For backend and frontend coding.

Recommended fallback order:

1. `cx/gpt-5.5`
2. `kr/claude-sonnet-4.5-thinking-agentic`
3. `kr/qwen3-coder-next-agentic`
4. `kr/deepseek-3.2-agentic`
5. `kr/minimax-m2.5-agentic`

## `Quality`

For testing and code review.

Recommended fallback order:

1. `cx/gpt-5.5-review`
2. `kr/claude-sonnet-4.5-thinking`
3. `cx/gpt-5.4-mini-review`
4. `kr/deepseek-3.2-thinking`

## `Verification`

For the final acceptance and release gate.

Recommended fallback order:

1. `cx/gpt-5.6-sol-review`
2. `cx/gpt-5.5-review`
3. `kr/claude-sonnet-4.5-thinking`
4. `kr/glm-5-thinking`

## OpenCode provider note

Your OpenCode custom provider must expose these combo models in `opencode.json`. Example model entries:

```json
"models": {
  "Analysis": { "name": "Analysis" },
  "Implementation": { "name": "Implementation" },
  "Quality": { "name": "Quality" },
  "Verification": { "name": "Verification" }
}
```

Keep the API key outside Git. Prefer an environment variable reference.
