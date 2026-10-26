# QA Agents Framework

A Claude Code pipeline that turns a spec (in any format) into reviewed test cases, browser-executed results with evidence, and passing Playwright tests.

```
spec-*.md ─▶ 1 generate ─▶ 2 review ⇄ you ─▶ 3 execute (browser + Figma) ─▶ 4 automate
             └──────────── one file: <feature>-test-cases.xlsx ────────────┘   *.spec.ts (run & green)
```

## One-time setup

1. **Install:** Node.js 20+, then in this folder:
   ```bash
   npm install
   npx playwright install chromium
   ```
2. **Open Claude Code in this folder** and approve the `playwright` and `figma` MCP servers when prompted (or check with `/mcp`).
3. **Run `/qa-setup`.** It interviews you and fills in `context/`, sets `APP_URL` in `.env`, and adds your role variables to `.env.secrets`.
4. **Fill in `.env.secrets`** yourself: `ROLE_<ROLE>_EMAIL` / `ROLE_<ROLE>_PASSWORD` for each role, plus `FIGMA_API_KEY` if you want design comparison. Agents never read this file. After changing it, reconnect the `playwright` server in `/mcp`.
5. **Figma (optional):** put the design link in `.env` as `FIGMA_URL=`. If it's empty when execution starts, `/qa` asks you to add it or skip.
6. **Optional:** add module files to `context/modules/` (see its README).

## Testing a feature

1. Drop a spec into `data/inputs/`, named `spec-<feature>.md`. Any format works: bullets, a pasted ticket, rough notes.
2. Run `/qa spec-<feature>.md`.
3. The skill walks you through the four stages:
   - **Generate:** test cases traced to the requirements extracted from your spec, plus open questions for anything unclear. You can answer the questions straight away.
   - **Review:** a separate reviewer (a different model) reports findings, and you decide whether the generator should fix them. This loops until you're satisfied.
   - **Execute:** approved cases run in a real browser. Each result and its screenshot are added to the same Excel file. If `FIGMA_URL` is set, screens are also compared with the design.
   - **Automate:** passed cases become Playwright tests that are run until green and checked for flakiness.

To resume or repeat one stage: `/qa spec-<feature>.md --from review|execute|automate`.

## Where things go

```
data/inputs/spec-<feature>.md                       your spec (never modified)
data/outputs/1-test-cases/<feature>-test-cases.xlsx
    Test Cases       cases · review status · execution status · actual result · screenshot (embedded)
    Requirements     what the spec asks for, and which cases cover it
    Open Questions   unclear points in the spec and the assumptions used
    About            version, environment, Figma link, last run, counts
data/outputs/4-automation/                          generated Playwright tests
```

Keep the Excel file closed while `/qa` is running; an open file can't be updated. Each new execution run replaces the previous results.

Run the generated tests yourself with `npx playwright test` (HTML report in `data/outputs/4-automation/.report`).

## Framework layout

| Path | What it is |
|---|---|
| `.claude/skills/qa/` | `/qa` pipeline orchestrator (talks to you) |
| `.claude/skills/qa-setup/` | `/qa-setup` onboarding interview |
| `.claude/agents/` | The five unattended agents (generic, not edited per project) |
| `scripts/` | The only way agents touch the Excel file: `tc-write`, `tc-read`, `tc-review`, `tc-result` |
| `templates/data-formats.md` | What agents pass to those scripts |
| `context/` | Project knowledge (per project) |
| `.mcp.json` | Playwright MCP (`--secrets .env.secrets`, headless) and Figma MCP |
| `playwright.config.ts` | Config for the generated tests |
| `CLAUDE.md` | Rules every session and agent follows |

## Notes

- **Not on Windows?** `.mcp.json` launches servers with `cmd /c npx …`. On macOS/Linux, change `"command": "cmd"` to `"npx"` and drop `"/c", "npx"` from the args.
- **Watch the browser:** remove `--headless` from the playwright server in `.mcp.json`.
- **Agents and models:** the generator uses Sonnet and the reviewer uses Opus, so the reviewer isn't checking work from the same model. Change `model:` in each agent's frontmatter if needed.
