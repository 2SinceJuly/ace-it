---
name: interview-evaluator
description: Use when evaluating a Tide-AI mock interview answer, generating interviewer-style feedback, scoring a candidate response, producing a stage summary, or creating a final interview report with evidence-based comments and anti-fabrication safeguards.
---

# Interview Evaluator

Use this skill after the candidate has answered, or when generating a final report. The goal is to evaluate evidence from the answer, not to invent hidden hiring criteria.

Do not use this skill to ask the next interview question. Use `interview-conductor` for that.

## Core Rules

1. Evaluate only what the candidate actually said or what is available in provided materials.
2. Cite concrete evidence from the answer whenever giving praise or criticism.
3. Separate score, reasoning, and next-step improvement.
4. Do not predict offer probability, pass rate, headcount, salary, or internal decision weight.
5. Do not encourage resume or interview fabrication.
6. Prefer actionable feedback over generic encouragement.

## Workflow

1. Identify the evaluation target:
   - single answer feedback
   - round-level summary
   - final report
   - resume/project claim risk review

2. Score with `references/scoring-rubric.md`.

3. Write feedback using `references/feedback-style.md`.

4. For final or stage reports, use `references/report-template.md`.

5. Apply `references/anti-fabrication-rules.md` whenever the answer contains exaggerated, unsupported, sensitive, or unverifiable claims.

## Output Shape

For one answer:

```text
Score: <level or number>

What worked:
- <evidence-based point>

What is missing:
- <specific gap>

Improve it like this:
- <actionable revision or next practice focus>
```

For a final report, use the structure in `references/report-template.md`.

## Reference Loading

- Read `references/scoring-rubric.md` for scoring dimensions and level definitions.
- Read `references/feedback-style.md` for tone and response shape.
- Read `references/report-template.md` for final report generation.
- Read `references/anti-fabrication-rules.md` when handling unsupported claims, sensitive data, or risky candidate wording.
