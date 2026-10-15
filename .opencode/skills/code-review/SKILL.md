---
name: code-review
description: Review a scoped git diff for correctness, security, architecture consistency, maintainability, performance, compatibility, and missing tests
compatibility: opencode
metadata:
  workflow: quality-gate
  audience: reviewer
---

# Code Review

## Inputs

- requirement and acceptance criteria
- approved plan
- complete scoped diff
- relevant test results

## Procedure

1. Trace each acceptance criterion into the diff.
2. Follow affected code paths, including failure paths.
3. Check authentication, authorization, ownership, and secret handling.
4. Check data integrity, transaction, concurrency, and idempotency.
5. Check compatibility and migration behavior.
6. Check error handling and observability.
7. Check architecture and duplication.
8. Check tests for meaningful assertions and missing cases.
9. Classify findings by severity.

## Finding format

- severity
- file and location
- evidence
- impact
- remediation direction

## Verdict

Return `PASS` only when no blocking issue remains. Otherwise return `REQUEST_CHANGES`.
