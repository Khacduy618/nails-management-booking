# Project Instructions for OpenCode

## Operating principles

- Read the relevant code, configuration, tests, and documentation before proposing changes.
- Preserve the existing architecture, naming conventions, package manager, and coding style.
- Keep every change inside the approved scope.
- Do not refactor unrelated code.
- Do not invent APIs, tables, environment variables, commands, or product requirements.
- State assumptions when repository evidence is incomplete.
- Prefer small, reviewable changes over broad rewrites.
- Never expose, print, commit, or copy secrets, tokens, passwords, private keys, or production credentials.
- Never run destructive commands, production migrations, force pushes, or deployments without explicit approval.

## Required delivery flow

For non-trivial work, follow this sequence:

1. Clarify the requirement and acceptance criteria.
2. Inspect the existing implementation.
3. Produce an implementation plan with impacted files, risks, and verification steps.
4. Wait for approval when the change is high-risk, ambiguous, destructive, or architectural.
5. Implement only the approved scope.
6. Add or update tests.
7. Run focused checks first, then broader checks when practical.
8. Review the diff for correctness, security, maintainability, and unintended changes.
9. Verify every acceptance criterion and report PASS or FAIL.

## Evidence rules

- Base claims on repository evidence, command output, test output, or documented requirements.
- Distinguish confirmed facts from assumptions.
- Do not claim that a command, test, build, migration, or deployment succeeded unless it was actually run successfully.
- When a check cannot be run, state exactly what remains unverified.

## Change rules

- Reuse existing abstractions before introducing new ones.
- Ask before adding dependencies unless the requirement explicitly needs one.
- Validate external input at the system boundary.
- Preserve authorization and ownership checks.
- Handle failure paths explicitly.
- Keep database changes backward-compatible when possible.
- Include migrations for schema changes and never edit previously applied production migrations.
- Avoid changing environment files unless requested. Update example files rather than real secret files.

## Testing rules

At minimum consider:

- happy path
- invalid input
- empty and null values
- authentication
- authorization and ownership
- not-found cases
- duplicate or conflicting operations
- external-service failure
- regression risk

## Completion report

Every implementation response should end with:

- Summary
- Files changed
- Tests/checks run
- Acceptance criteria status
- Risks or remaining work
