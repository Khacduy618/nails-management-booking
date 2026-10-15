---
name: backend-implementation
description: Implement approved backend changes using existing project patterns with validation, authorization, failure handling, data integrity, and focused tests
compatibility: opencode
metadata:
  workflow: implementation
  audience: backend
---

# Backend Implementation

## Before coding

- read acceptance criteria
- inspect existing handlers, services, repositories, schemas, and tests
- confirm approved scope
- preserve unrelated worktree changes

## Implementation checklist

- validate input at boundaries
- enforce authentication and authorization server-side
- preserve ownership checks
- handle not-found and conflict cases
- protect secrets and sensitive fields
- use transactions where partial completion is unsafe
- avoid N+1 queries
- preserve backward compatibility unless explicitly changed
- add structured error handling
- reuse existing abstractions
- add focused tests

## Verification

Run the narrowest relevant commands first:

1. focused test
2. type check
3. lint
4. broader test suite when practical

Report commands and actual results.
