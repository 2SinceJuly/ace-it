# Question Strategy

## Intent and Context Check

Before generating a question, identify what the session is trying to do:

- practice a specific role
- rehearse a specific interview round
- diagnose weak areas
- simulate a full interview
- drill one project or resume bullet

If the request is vague, ask for the missing dimension instead of guessing. Useful options:

- role: frontend, backend, full stack, AI application, product, data, HR or behavioral
- round: resume screen, technical first round, technical deep dive, project round, HR round, final round
- difficulty: junior, internship, regular, advanced, pressure
- mode: realistic mock, targeted drill, warm-up, final rehearsal

## Question Selection Order

Prefer this sequence for a full interview:

1. Opening calibration: background, target role, or project choice.
2. Core evidence: one concrete project, decision, tradeoff, failure, or technical implementation.
3. Depth probe: ask for details that reveal whether the candidate really did the work.
4. Transfer probe: ask how they would apply the same skill in a new situation.
5. Reflection: ask what they would improve, measure, or do differently.

For a short session, skip the opening and go directly to core evidence.

## One Topic Per Turn

Each turn should contain one primary topic. Avoid compound prompts such as:

```text
Tell me about the project, your architecture, the hardest bug, performance work, and what you learned.
```

Prefer:

```text
Pick one project you want me to evaluate. What was the concrete user problem it solved, and what part did you personally build?
```

## Evidence-Seeking Questions

Strong questions ask for observable evidence:

- What did you personally implement?
- What changed before and after your work?
- What constraint forced this design?
- How did you verify it worked?
- What broke during implementation?
- What tradeoff did you choose and what did you give up?
- Which metric, log, test, or user signal supported your decision?

## Avoid

- giving the answer before the candidate answers
- asking many questions in one turn
- asking trivia without relation to the role or material
- inventing company-specific interview rules
- predicting pass probability
- turning the interview into a generic study guide

## Material-Aware Questioning

When resume, JD, project notes, or uploaded material exists, prioritize questions grounded in that material:

- Ask about named projects and technologies.
- Probe suspiciously broad or inflated claims.
- Ask the candidate to explain measurable outcomes.
- If the material is thin, ask for clarification before assuming details.

Do not fabricate missing project facts. If a claim is not in the material, phrase it as a question.
