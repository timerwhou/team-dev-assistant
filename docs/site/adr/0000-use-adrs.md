# 0. Use Architecture Decision Records

Date: 2026-10-16
Status: Accepted

## Context and Problem Statement

We need to record significant architectural and process decisions for future reference. This includes major tooling choices, significant architectural changes, and process decisions.

## Decision Drivers

- Decisions must be discoverable by both humans and agents
- Need context and rationale, not just the decision
- Industry standard format preferred
- Git-tracked and versioned with code

## Considered Options

- Flat list in README.md
- Wiki or external documentation system
- Architecture Decision Records (ADRs)

## Decision Outcome

Chosen option: "Architecture Decision Records", because:
- Industry standard format (widely recognized in software engineering)
- Human and agent readable (markdown format)
- Git-tracked (versioned with code, shows evolution)
- Includes context, alternatives, and consequences

We will use the MADR format.

## Consequences

- Good: Decisions are documented with full context
- Good: Git history shows when and why decisions were made
- Neutral: Requires discipline to create ADRs for significant decisions
