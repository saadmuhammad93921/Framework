---
name: qa-setup
description: Interview the user about their project and fill in the context/ files (project overview, roles, test standards, optional module files) plus .env and the role variable names in .env.secrets. Use when the user says /qa-setup, is setting up the QA framework for a new project, or /qa reports that context is missing.
---

# /qa-setup: project onboarding

You run in the main session, so you can talk to the user. Ask **one group of questions at a time** and wait for the answers. Accept short or partial answers, and don't press for detail the user doesn't have.

## Credentials
- Never read `.env.secrets`.
- Ask the user to type passwords into `.env.secrets` themselves rather than pasting them into chat (chat transcripts are stored). If they paste credentials anyway, write them only to `.env.secrets`, never to `context/` or anywhere else, and don't repeat them back.
- To add a variable without reading the file: check `grep -c '^NAME=' .env.secrets`; if it prints 0, `echo 'NAME=' >> .env.secrets`.

## Interview

**Group 1: project**
1. Application name, and what it does and for whom (1–3 sentences)
2. Which environment to test against, and its URL (staging/test, never production)
3. Is there an existing automation repo? Path and framework, if so

**Group 2: roles**
4. Which user roles exist? For each one: what can it do or not do?
5. Do you have a test account for each role? (Only the yes/no here; the credentials go in `.env.secrets`)

**Group 3: standards** (offer the defaults in `context/test-standards.md`; the user can accept them as-is)
6. Priority definitions, naming conventions, anything out of scope or never to automate

**Group 4: modules (optional)**
7. Module files in `context/modules/` are the user's own. Ask whether they want to add any now. If so, ask for each module's name and a short description of how it works, and create `context/modules/<name>.md` following `context/modules/README.md`. Create only the modules they name. Skip this group if they prefer to drop in their own files later.

## Write

- `context/project-overview.md`: app, users, environments, automation repo path
- `context/roles.md`: one section per role, headed with the exact role name agents must use (e.g. `## Standard User`), with its permissions, its credential **variable names** `ROLE_<ROLE_NAME>_EMAIL` / `ROLE_<ROLE_NAME>_PASSWORD` (UPPER_SNAKE_CASE of the role name), and a module × role access table if the user described one
- `context/test-standards.md`: update only what the user changed
- `.env`: set `APP_URL` and `APP_ENV`
- `.env.secrets`: append the missing `ROLE_*` variable names with empty values
- `context/INDEX.md`: update the Status table

Keep anything the user already wrote in these files; merge, don't overwrite.

## Finish

Tell the user:
1. What was written
2. To open `.env.secrets` and fill in the `ROLE_*` values. For design comparison, also add `FIGMA_API_KEY` there and the Figma link as `FIGMA_URL` in `.env`.
3. To drop a spec into `data/inputs/` (e.g. `spec-login.md`, any format) and run `/qa spec-login.md`
