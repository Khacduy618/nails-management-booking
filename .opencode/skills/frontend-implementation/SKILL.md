---
name: frontend-implementation
description: Implement approved frontend behavior with existing components, complete UI states, accessibility, responsiveness, typed contracts, and focused tests
compatibility: opencode
metadata:
  workflow: implementation
  audience: frontend
---

# Frontend Implementation

## Before coding

- read acceptance criteria
- inspect existing design primitives and page patterns
- confirm API contracts
- identify responsive and accessibility requirements

## Required states

Consider:

- loading
- empty
- error
- success
- disabled
- unauthorized
- not found

## Quality checklist

- use semantic HTML
- maintain keyboard access and visible focus
- provide labels and accessible names
- reuse existing components and tokens
- keep local state local
- avoid unnecessary rerenders and requests
- keep server/client boundaries consistent
- handle stale and failed requests
- add focused tests where supported

## Verification

Run relevant lint, type, component, and integration checks. Report actual results.
