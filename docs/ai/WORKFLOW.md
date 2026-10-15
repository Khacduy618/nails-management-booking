# AI Delivery Workflow

## Primary agents

### `planning`

Use for discovery, requirement clarification, architecture, sequencing, and risk analysis. It is read-only.

### `delivery`

Use after the plan is accepted. It coordinates implementation, testing, review, and verification.

## Subagents

- `@ba`: requirement clarification and acceptance criteria
- `@pm`: scope, task sequencing, dependencies, delivery risks
- `@architect`: architecture and technical design
- `@backend`: backend implementation
- `@frontend`: frontend implementation
- `@qa`: test design and execution
- `@reviewer`: independent code review
- `@verifier`: final requirement traceability and release gate

## Recommended flow

```text
planning
├── @ba
├── @architect
└── @pm
     ↓
User approves plan
     ↓
delivery
├── @backend and/or @frontend
├── @qa
├── @reviewer
└── @verifier
     ↓
PASS or REQUEST_CHANGES
```

## Handoff contract

Every agent handoff should contain:

- goal
- approved scope
- relevant requirements
- acceptance criteria
- files or modules involved
- constraints
- unresolved questions
- expected output

## Completion gates

A task is complete only when:

1. The implementation matches approved scope.
2. Focused tests pass.
3. Review has no unresolved blocking issue.
4. Verifier maps every acceptance criterion to evidence.
5. Remaining risks are explicitly documented.
