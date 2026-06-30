# Follow-Up Rules

## Decide Whether to Follow Up

Follow up when the candidate's answer is:

- vague: lacks concrete actions, constraints, or results
- inflated: claims large impact without proof
- passive: says "we did" without personal contribution
- shallow: names technology but cannot explain tradeoffs
- risky: includes fabricated, unverifiable, or inconsistent claims
- incomplete: does not answer the question asked

Move on when the answer has:

- clear personal contribution
- concrete implementation details
- constraints and tradeoffs
- verification evidence
- reasonable reflection

## Follow-Up Types

Use one follow-up type at a time.

### Clarify Ownership

Use when the answer hides personal contribution.

```text
Follow-up:
Which part did you personally design or implement, and which parts were handled by teammates or existing code?
```

### Probe Technical Depth

Use when the answer names tools but lacks mechanism.

```text
Follow-up:
Walk me through the exact request or data flow for that feature, from user action to persisted result.
```

### Probe Tradeoff

Use when the answer presents a decision as obvious.

```text
Follow-up:
What alternative did you reject, and what made your chosen approach better under the project constraints?
```

### Probe Verification

Use when the answer claims success without evidence.

```text
Follow-up:
How did you verify the change worked: test, metric, log, user feedback, or manual scenario?
```

### Probe Failure and Recovery

Use when the answer sounds too polished.

```text
Follow-up:
What was the hardest bug or wrong assumption in this work, and how did you isolate it?
```

## Pressure Without Hostility

Pressure should come from specificity, not rudeness. Good pressure:

- asks for exact examples
- asks for evidence
- asks the candidate to resolve contradictions
- asks for tradeoffs and failure cases

Avoid:

- sarcasm
- personal judgment
- implying the candidate is lying
- asking hostile multi-part traps

## When the Candidate Cannot Answer

Do not immediately give the model answer. Ask one recovery prompt:

```text
Follow-up:
Think about the path step by step. What is the first component or function that receives the user's action?
```

If they still cannot answer, move to a simpler neighboring question.
