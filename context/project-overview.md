# Project Overview

## Application

**Name:** ToolBerry
**Description:** Field-service management app (jobs, scheduling, invoicing, proposals, assets/rentals, customers) for trades/service businesses and their crews. Primary users: business owners/admins who manage the workspace, and staff/crew members who work assigned jobs in the field.
**Type:** Web app (Quasar/Vue frontend + Node backend), with Capacitor-based mobile (iOS/Android).

## Environments

| Name | URL | Purpose |
|------|-----|---------|
| QA | https://qa.toolberry.app | Primary test target |
| Production | https://app.toolberry.app (or equivalent) | Live - never test here |

**Active test environment:** QA (qa.toolberry.app)

## Automation Repository

**Path:** `tests/e2e` (relative to the main `toolberry` repo root - sibling of `TB_Agents-main/`). This
is the project's real, established Playwright e2e suite - not the `data/outputs/4-automation/`
scratch setup TB_Agents falls back to when no path is given. It already has a Scenarios pattern
(`fixtures/base.scenarios.ts`, per-entity `{entity}.scenarios.ts`), config-driven `data-testid`
locators (via `@shared/core/entities/<entity>/<entity>.config`), and a `specs/transfer/` folder
with `transfer.scenarios.ts` already written (no `_transfer.spec.ts` yet). File naming:
`_{entity}.spec.ts` / `{entity}.scenarios.ts` / `{entity}.testdata.ts` - see `tests/e2e/README.md`
and `@architecture/e2e-testing.md` for full conventions before writing anything here.
**Branch:** main

## Key Feature Areas / Modules

<!-- List the main feature areas. Add a modules/*.md file for each. -->
- Jobs (work orders) - scheduling, dispatch, parts, services
- Invoices / Proposals
- Customers / Sites / Contacts
- Assets & Rentals
- Timesheets / Expenses
- Settings: Roles & Permissions (custom role builder, permission matrix)
- BYOS (Bring Your Own Storage / Dropbox sync) - multi-device, multi-user sync
- <!-- add more as needed -->

## Notes

- ToolBerry's permission model is role-based with a permission matrix per entity (List/Create/Edit/Delete + named actions), plus a separate row-visibility layer (e.g. "Assigned only" vs "All records") for entities tied to Jobs. Some child entities (e.g. Job Parts) have their OWN matrix row but their actual row-visibility silently cascades from their parent entity's row-scope, not from their own row - worth knowing before writing role-based test cases.
- `unitCost`/cost-like fields on several entities (parts, rentals, invoice/proposal items) are owner/admin-only (hidden on read, rejected on write) via a shared SECURITY_FLOOR mechanism - a common thing to verify per-role.
- "Staff" is a built-in system role and cannot be edited directly; a custom role must be created (often by duplicating Staff) to test different Job-visibility scopes.
