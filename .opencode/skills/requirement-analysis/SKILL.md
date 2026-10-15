---
name: requirement-analysis
description: Clarify a software request into actors, business rules, edge cases, assumptions, and measurable acceptance criteria before implementation
compatibility: opencode
metadata:
  workflow: discovery
  audience: ba-planner
---

# Requirement Analysis

## Use when

- the request is ambiguous
- business rules are incomplete
- acceptance criteria are missing
- implementation would require assumptions

## Inputs

- original user request
- existing product behavior
- relevant repository evidence
- constraints and known exclusions

## Procedure

1. Identify the problem and desired outcome.
2. Identify actors and permissions.
3. Separate functional and non-functional requirements.
4. Extract validation, authorization, and error rules.
5. Enumerate happy paths and edge cases.
6. Identify assumptions and contradictions.
7. Ask only questions that materially change scope or behavior.
8. Write observable acceptance criteria.

## Acceptance-criteria quality check

Each criterion should state:

- precondition or context
- action
- observable result
- relevant permission or error behavior

## Output

- problem statement
- actors
- user stories
- business rules
- edge cases
- assumptions
- open questions
- acceptance criteria
