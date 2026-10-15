---
name: release-verification
description: Perform a final evidence-based acceptance gate by mapping requirements to implementation, tests, review status, and residual risk
compatibility: opencode
metadata:
  workflow: release-gate
  audience: verifier
---

# Release Verification

## Required evidence

- final acceptance criteria
- scoped implementation diff
- test command output
- review findings and resolutions
- migration or deployment notes when relevant

## Procedure

1. Create one row per acceptance criterion.
2. Cite implementation evidence.
3. Cite automated or manual test evidence.
4. Confirm required checks actually ran.
5. Confirm no blocking review issue remains.
6. Identify scope drift.
7. Identify unverified areas and residual risks.

## Verdict rules

- `PASS`: all required criteria have evidence and no blocker remains
- `FAIL`: a criterion is unmet or a blocker remains
- `PARTIAL`: required evidence cannot be obtained

Never infer success from the absence of an error report.
