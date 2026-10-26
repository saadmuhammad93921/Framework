# Spec: Job Parts (DEV-2152) - Pro/Team scope

Source docs (read for full context, don't duplicate verbatim):
- `@docs/DEV-2152-job-parts/01-requirements.md`
- `@docs/DEV-2152-job-parts/02-implementation-plan.md`
- `@docs/DEV-2152-job-parts/03-pro-only-test-cases.md` (already-written Pro-only test cases - reuse
  these as the authoritative source; this spec exists mainly to feed them through the pipeline for
  automated browser execution, not to re-derive new cases from scratch)

## What Job Parts is

A list of the parts a job needs, found on the Job page's "Parts" card. The office plans
quantities before the visit; the crew records how many were used and returned. Only the **used**
quantity is billed, flowing automatically onto the job's Draft invoice. A part is usually picked
from the Service Catalog (name/price/cost snapshot copied at add-time), but can also be entered as
free text with no catalog link.

## Scope for this pass

This pass tests the **Pro/Team (authenticated, synced) scope only** - behavior that requires a
real backend, roles/permissions, or multi-device sync, as opposed to core CRUD already verified on
the Free tier. Concretely, draw test cases from `@docs/DEV-2152-job-parts/03-pro-only-test-cases.md`:

1. `unitCost` is hidden from a non-owner/admin role, both reading and writing.
2. A part added via the Service Catalog picker snapshots the catalog item's price/cost/description
   at add-time - a later change to the catalog item's own cost does NOT retroactively change an
   already-added part or its already-billed invoice line.
3. A crew member without invoice-edit rights can still record part quantities on a job; the job's
   Parts card shows a "parts not on the invoice yet" gap note; an owner/admin's later invoice save
   reconciles the gap.
4. Role-based Job visibility controls Parts visibility: Parts is a child of Job and follows the
   Job's own row-scope (e.g. "Assigned only" vs "All records") rather than having independent
   row-level scoping of its own, even though Parts has its own entry in the Roles permission matrix.

## Role

Owner/Admin (`ROLE_OWNER_ADMIN_EMAIL` / `ROLE_OWNER_ADMIN_PASSWORD`) for all setup and verification
steps. Where a case needs a second, more restricted role, use the custom `Test` role
(`ROLE_TEST_EMAIL` / `ROLE_TEST_PASSWORD`) - mark the case BLOCKED if that role's credentials or
its permission setup aren't ready yet, rather than guessing its configuration.

Sign-in uses an emailed one-time code; the user types it in manually when prompted mid-run.

## Out of scope for this pass

- Core Free-tier CRUD on parts (add/edit/delete a part, planned/used/returned quantities, the
  billing-gap review flag) - already verified separately.
- True multi-device offline race conditions (two devices both offline, syncing back at the same
  moment) - not reliably reproducible through a single scripted browser session; skip and mark
  BLOCKED with a one-line reason if a case would require this.
- Stock decrement, defective quantity, order status/ETA, return tracking - explicitly out of scope
  for DEV-2152 v1 itself.
