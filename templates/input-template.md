# Input Files — Naming Convention

Drop your requirement or spec files into `data/inputs/`.

## File naming

Use this pattern so agents can identify what the file covers:

```
spec-<feature-or-flow>.md
```

Examples:
- `spec-login.md`
- `spec-password-reset.md`
- `spec-booking-flow.md`
- `spec-admin-dashboard.md`

The part after `spec-` becomes the feature name: it names the output folder and the test case IDs (`spec-booking-flow.md` gives `TC-BOOKING-FLOW-001`).

## File content

There is no required format. Write whatever you have:
- A few bullet points
- A full user story
- Copy-pasted Jira ticket text
- A rough description in plain English
- A mix of notes and screenshots descriptions

The test-case-generator agent will read whatever you provide and generate test cases from it.
