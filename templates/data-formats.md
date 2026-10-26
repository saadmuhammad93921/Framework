# Data Formats

Each feature has **one file**: `data/outputs/1-test-cases/<feature>-test-cases.xlsx`.
It holds the test cases, the review verdicts, the execution results and the screenshots.

| Sheet | Contents |
|---|---|
| Test Cases | One row per case: test case columns, review columns, execution columns, embedded screenshot |
| Requirements | Requirements extracted from the spec, with which cases cover them (red = uncovered) |
| Open Questions | Gaps in the spec, the assumption used, and the user's answer |
| About | Feature, source spec, version, environment, Figma link, last run, counts |

Agents never open the XLSX directly. They read and write it only through the scripts below, exchanging JSON on stdin/stdout. Nothing else is written to `data/outputs/` for test cases or execution.

---

## Scripts

| Command | Used by | Does |
|---|---|---|
| `node scripts/tc-write.js <feature> < cases.json` | generator | Validates and creates/replaces the workbook. Increments the version. Keeps execution results and screenshots only for cases that stay `APPROVED`. |
| `node scripts/tc-read.js <feature> [--approved] [--summary]` | everyone | Prints the workbook as JSON (`hasScreenshot` shows whether a screenshot is embedded), or just the counts |
| `node scripts/tc-review.js <feature> < verdicts.json` | /qa skill | Writes review verdicts |
| `node scripts/tc-result.js <feature> --start` | /qa skill | Clears the previous run's results, records environment and `FIGMA_URL`, lists the APPROVED cases |
| `node scripts/tc-result.js <feature> < result.json` | manual tester | Records one result, embeds its screenshot, deletes the temporary image |

Pass JSON with a heredoc:
```bash
node scripts/tc-review.js checkout <<'EOF'
[{"id": "TC-CHECKOUT-001", "status": "APPROVED", "notes": ""}]
EOF
```

---

## 1. Test cases (input to `tc-write.js`)

```json
{
  "source": "data/inputs/spec-login.md",
  "requirements": [
    { "id": "R1", "text": "User can sign in with a registered username and password" }
  ],
  "openQuestions": [
    { "id": "Q1", "question": "How many failed attempts lock the account?", "relatedReqs": ["R3"],
      "assumptionUsed": "Assumed 5 attempts", "answer": "" }
  ],
  "testCases": [
    {
      "id": "TC-LOGIN-001",
      "title": "Sign in with valid credentials",
      "module": "Login",
      "priority": "P0",
      "type": "Functional",
      "role": "Standard User",
      "reqRefs": ["R1"],
      "preconditions": "User is signed out and on the sign-in page",
      "steps": [
        "Type ROLE_STANDARD_USER_EMAIL in the Username field",
        "Type ROLE_STANDARD_USER_PASSWORD in the Password field",
        "Click Login"
      ],
      "expectedResult": "Products page is displayed",
      "testData": "ROLE_STANDARD_USER_EMAIL, ROLE_STANDARD_USER_PASSWORD",
      "assumptions": "",
      "reviewStatus": "PENDING",
      "reviewNotes": ""
    }
  ]
}
```

| Field | Rule |
|---|---|
| `requirements[].id` | `R1`, `R2`, … atomic, testable statements from the spec |
| `openQuestions[]` | Anything the spec leaves unclear, with the assumption used; `answer` filled when the user answers |
| `testCases[].id` | `TC-<FEATURE>-<NNN>`; never renumbered or reused |
| `role` | **Exactly** a role name from `context/roles.md` |
| credentials | The variable name from `roles.md` (`ROLE_STANDARD_USER_PASSWORD`), never a value |
| `priority` / `type` | `P0`–`P3` / `Functional` `UI` `API` `Security` `Accessibility` `Performance` |
| `steps` | One action per string, no numbering |
| `assumptions` | Filled whenever the expected result depends on a guess |
| `reviewStatus` | `PENDING` for new or changed cases; unchanged cases keep their status |

## 2. Review verdicts (input to `tc-review.js`)

```json
[
  { "id": "TC-LOGIN-001", "status": "APPROVED", "notes": "" },
  { "id": "TC-LOGIN-002", "status": "NEEDS-REVISION", "notes": "Step 3: specify which Save button" },
  { "id": "TC-LOGIN-003", "status": "REJECTED", "notes": "Duplicate of TC-LOGIN-001" }
]
```

## 3. One execution result (input to `tc-result.js`)

```json
{
  "id": "TC-LOGIN-002",
  "status": "FAIL",
  "failedStep": 3,
  "actualResult": "No error message shown; page stayed on sign-in",
  "notes": "Console: TypeError in login.js",
  "designMatch": "PARTIAL",
  "designNotes": "Button label is 'Login' in app, 'Sign in' in Figma",
  "screenshot": ".tmp/TC-LOGIN-002.jpeg"
}
```

| Field | Rule |
|---|---|
| `status` | `PASS` `FAIL` `BLOCKED` |
| `failedStep` | Required for `FAIL` (1-based step number) |
| `screenshot` | Required unless `BLOCKED`. Saved under `.tmp/`, embedded into the workbook and then deleted. For a FAIL, take it at the failing step. |
| `notes` | Optional: blocked reason, console errors, anything useful |
| `designMatch` | `MATCH` `MISMATCH` `PARTIAL` `N/A`; advisory only |
