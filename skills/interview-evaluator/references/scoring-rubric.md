# Scoring Rubric

## Recommended Dimensions

Use dimensions that match the interview type. Do not force every dimension into every answer.

### Technical Depth

Looks for:

- concrete implementation details
- correct mental model
- system boundaries
- tradeoff awareness
- debugging or verification method

Weak signs:

- only names tools
- cannot explain request/data flow
- no failure cases
- no test or verification evidence

### Ownership

Looks for:

- clear personal contribution
- distinction between individual work, team work, and existing code
- decisions the candidate personally made

Weak signs:

- repeated "we" with no personal role
- inflated scope
- unclear responsibility

### Problem Framing

Looks for:

- clear user or business problem
- constraints
- success criteria
- prioritization rationale

Weak signs:

- jumps to implementation before explaining the problem
- cannot explain why the work mattered

### Communication

Looks for:

- structured answer
- concise explanation
- examples before abstractions
- understandable terms

Weak signs:

- long unfocused narration
- buzzwords without grounding
- missing conclusion

### Reflection and Learning

Looks for:

- what went wrong
- what changed after feedback
- what the candidate would improve
- how the candidate learned from the work

Weak signs:

- answer sounds perfect
- no limitations
- blames others without owning next action

## Five-Level Scale

Prefer this scale for user-facing feedback:

- `Excellent`: strong evidence, clear ownership, concrete depth, mature tradeoffs
- `Strong`: mostly clear and credible, with one or two missing details
- `Passable`: answers the question but lacks depth, evidence, or structure
- `Weak`: vague, generic, unsupported, or misses the question
- `Risky`: contains contradictions, likely fabrication, sensitive claims, or severe misunderstanding

If numeric scoring is required, map levels to:

- Excellent: 90-100
- Strong: 75-89
- Passable: 60-74
- Weak: 40-59
- Risky: below 40

Avoid false precision. Do not output decimal scores unless the product explicitly requires it.

## Evidence Rule

Every non-obvious score should be justified by evidence:

```text
Because you explained <specific evidence>, this shows <dimension>.
Because you did not mention <missing evidence>, the answer is weaker on <dimension>.
```

Do not penalize the candidate for information that was never asked unless that information is essential to the original question.
