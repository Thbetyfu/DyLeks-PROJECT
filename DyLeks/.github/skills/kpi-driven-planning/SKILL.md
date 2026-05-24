---
name: kpi-driven-planning
description: Build disciplined, KPI-gated plans from docs and project context, with no trial-and-error or unnecessary work.
argument-hint: What document, project, or task should be analyzed and planned?
---

# KPI-Driven Planning Skill

Use this skill when the user wants a mature plan, roadmap, implementation strategy, or execution checklist based on documents, codebase context, or project constraints.

## Purpose

Turn scattered project information into a clear, realistic, KPI-aligned plan. Work like a senior engineer: verify constraints first, define success criteria, and stop if the KPI set is incomplete.

## Operating Rules

- Read the relevant documents or code first before proposing a plan.
- Extract the actual goal, scope, constraints, dependencies, and KPI targets.
- Do not jump into implementation if the KPI definition is missing or ambiguous.
- Do not compare many approaches unless the current path is blocked.
- Prefer one coherent solution path over multiple speculative alternatives.
- Avoid unnecessary file creation, refactoring, or side work.
- Use PowerShell as the primary Windows shell when commands are required.

## Workflow

1. Review the available documents, instructions, and nearby code.
2. Identify the project objective and the KPI gates.
3. List what is known, what is uncertain, and what must be validated.
4. If KPI data is incomplete, stop and report the missing KPI items before proceeding.
5. If KPI data is sufficient, draft a phased plan with milestones, deliverables, dependencies, and acceptance criteria.
6. Keep the plan aligned to the real project context, not generic best practices.
7. Finish with a concise execution recommendation or next action.

## KPI Gate

Before any execution plan is accepted, confirm these items when relevant:

- Target outcome
- Success metrics or KPI thresholds
- Scope boundaries
- Technical constraints
- Timeline or milestone expectations
- Responsible area or owner

If any critical KPI is missing, do not continue as if it is known. State the missing items clearly and ask for them.

## Output Format

When producing a plan, use this structure:

- Goal
- Constraints
- KPI Gate
- Proposed Phases
- Deliverables per phase
- Risks and mitigations
- Next action

Keep the output direct, structured, and implementation-oriented.

## Quality Standard

The result should feel like it was prepared by a high-discipline engineering lead:

- Accurate to the source material
- Explicit about assumptions
- Focused on measurable outcomes
- Free from unnecessary scope
- Practical for execution in the current environment

## Stop Conditions

Stop and ask before continuing if:

- KPI targets are not defined
- The task scope conflicts with the available context
- The request would require guessing major requirements
- The user asks for an implementation path without enough decision criteria

## Example Uses

- "Analyze README dan buat rencana pengembangan yang KPI-driven"
- "Baca dokumentasi ini dan susun roadmap yang realistis"
- "Tentukan deliverables per fase dari project ini"
- "Berhenti kalau KPI belum lengkap dan jelaskan kekurangannya"
