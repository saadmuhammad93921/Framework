# Spec: Transfers (DEV-1375) - basic lifecycle

Source: `@docs/DEV-1375-transfers/01-requirements.md`, `03-implementation-notes.md` (as-shipped
behavior - trust this over the original plan where they differ).

## What Transfers is

A way to move one or more tracked assets from one place to another. A `transfer` header (direction,
type, from/to endpoint) has `transferItem` lines, each naming one asset. The header moves through a
simple stage machine: **draft -> inTransit (via Ship) -> received (via Receive)**. Receiving
atomically writes each line's asset to its new location/site.

## As-shipped specifics (don't test against the original plan - this is what's real)

- Only three stages exist: `draft`, `in_transit`, `received`. No `delivered` stage, no `cancel`
  action.
- **Ship** requires a destination (`toType` + `toId`) already set on the header - origin (`from`)
  stays optional. Ship is blocked/refused when no destination is set.
- **Receive** is the terminal action. It writes each line's asset `locationId` (if destination is a
  Location) or `siteId` (if destination is a Site), plus each line's `receivedAt` and the header's
  terminal timestamp.
- Receipt is whole-header only - there's no per-line partial receipt.
- `type` (shipment/relocation/return) is purely informational - it doesn't change behavior.

## Requirements

1. A transfer can be created in `draft` with a direction, a type, and at least one line (an
   existing tracked asset).
2. A saved draft transfer appears in the Transfers list with a generated name and stage "Draft".
3. An existing transfer's fields (e.g. notes, carrier, tracking) can be edited and persist after a
   reload.
4. Triggering Ship on a draft transfer with NO destination set is blocked with a validation error;
   the stage stays Draft.
5. Setting a destination (Location or Site) on a draft transfer, then triggering Ship, succeeds:
   the stage becomes "In Transit".
6. Triggering Receive on an in-transit transfer succeeds: the stage becomes "Received", and the
   transfer's line(s) show a received timestamp.
7. After Receive, the moved asset's location (or site) reflects the transfer's destination - check
   the asset's own record, not just the transfer.

## Role

Owner/Admin only (`ROLE_OWNER_ADMIN_EMAIL`). No other roles for this pass - this is a
straightforward CRUD + lifecycle pilot, not a permissions pass. Sign-in uses an emailed one-time
code; the user types it in manually when prompted mid-run.

## Out of scope for this pass

- Multi-asset atomic receipt specifically (more than one line) - single-line cases only for this
  pilot.
- BOL (Bill of Lading) print/attachment generation.
- Any role other than Owner/Admin.
- Two-client/offline idempotent receipt races.
