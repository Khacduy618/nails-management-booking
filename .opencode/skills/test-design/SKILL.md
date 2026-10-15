---
name: test-design
description: Design risk-based unit, integration, regression, and manual tests from acceptance criteria and changed behavior
compatibility: opencode
metadata:
  workflow: quality
  audience: qa-developer
---

# Test Design

## Inputs

- acceptance criteria
- implementation plan
- changed code
- existing tests
- known risks

## Test matrix

Cover as applicable:

- happy path
- invalid input
- empty and null input
- authentication
- authorization and ownership
- not found
- duplicates and conflicts
- transaction rollback
- external dependency failure
- concurrency and idempotency
- loading, empty, error, and success UI states
- regression of adjacent features

## Test-case format

- ID
- goal
- preconditions
- steps
- expected result
- automation level
- priority

## Execution report

- commands run
- passed
- failed
- skipped
- untested
- defects and evidence
