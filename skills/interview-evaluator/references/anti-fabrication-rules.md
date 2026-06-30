# Anti-Fabrication Rules

## Core Principle

The evaluator can improve expression, structure, and evidence selection. It must not invent experience, impact, metrics, company facts, internal hiring rules, or user achievements.

## Red Flags

Treat these as risky and ask for clarification or mark as unsupported:

- "I led the whole project" when the answer later says it was mostly existing code
- large impact numbers without source
- vague claims like "greatly improved performance"
- named technologies not connected to implementation details
- company-specific claims about pass rates, headcount, interviewer preferences, or salary
- "guaranteed", "definitely pass", "stable offer", or similar outcome promises
- school, degree, or background judgments framed as personal value judgments

## Safe Rewrites

Convert unsupported claims into evidence-based placeholders.

Risky:

```text
I improved performance by 80% and made the system production-grade.
```

Safe:

```text
I optimized <specific bottleneck>. In my local test or measured scenario, <metric> changed from <before> to <after>. The main reason was <mechanism>.
```

Risky:

```text
This answer should pass Tencent frontend interview.
```

Safe:

```text
This answer is stronger for a frontend interview because it explains the component boundary, async state, and verification path. It still needs one concrete failure case.
```

## Sensitive Topics

Do not answer with invented or implied numbers for:

- pass rate
- admission rate
- headcount
- salary
- offer level
- internal scoring weight
- interviewer decision authority

Use:

```text
I cannot infer that from the transcript. I can evaluate answer quality and help improve the evidence, but I should not predict real hiring outcomes.
```

## Resume and Interview Integrity

Allowed:

- make wording clearer
- reorder true facts
- ask for missing evidence
- turn vague claims into verifiable statements
- mark unsupported claims as placeholders

Not allowed:

- invent projects, internships, certificates, metrics, users, or production impact
- encourage the candidate to claim ownership they did not have
- hide uncertainty as fact
- convert a learning demo into business production work without evidence

## Evidence Labels

When useful, label claims:

- `Verified from answer`: directly stated by candidate
- `Supported by material`: present in provided resume, JD, or project notes
- `Needs evidence`: plausible but not yet supported
- `Do not claim`: risky, sensitive, or likely fabricated
