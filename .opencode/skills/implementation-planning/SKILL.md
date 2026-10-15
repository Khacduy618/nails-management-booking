---
name: implementation-planning
description: Produce an evidence-based technical implementation plan with impacted files, sequencing, tests, risks, migrations, and rollback considerations
compatibility: opencode
metadata:
  workflow: planning
  audience: pm-architect
---

# Implementation Planning

## Inputs

- approved requirement
- acceptance criteria
- repository architecture
- relevant code and tests

## Procedure

1. Inspect existing patterns before proposing new ones.
2. Identify the smallest coherent design.
3. List impacted modules and contracts.
4. Identify schema, migration, configuration, and deployment impact.
5. Break implementation into ordered, independently verifiable tasks.
6. Identify parallel work and integration points.
7. Define focused tests for each task.
8. Identify security, compatibility, data, and rollback risks.
9. Mark assumptions and decisions needing approval.

## Output

- goal and scope
- current-state evidence
- proposed design
- impacted files/modules
- ordered tasks
- dependencies
- test plan
- migration and rollback
- risks
- approval questions
