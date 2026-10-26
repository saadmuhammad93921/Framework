import { generateId } from '@shared/core/base/base.config'
import type { ScenarioFormData } from '../../types/scenarios.types'

/**
 * Transfer form data for tests.
 * `assetIds` is the create-only virtual multi-asset picker (fanned out to
 * `transferItem` lines on save) - see transfer.record.ts `TransferRecordData`.
 */
export interface TransferFormData extends ScenarioFormData {
  assetIds: string[]
}

/** Factory for transfer form data. Direction/type default server-side (transfer.config.ts), so
 *  tests only need to override what they're asserting on. */
export const createTransferData = (overrides?: Partial<TransferFormData>): TransferFormData => ({
  assetIds: [],
  ...overrides,
})

/**
 * `transfer2.test.db` seeds the same 5 assets as `asset.test.db` (same ids) plus 11
 * pre-built transfer headers/lines, so tests that only need "a transfer already in some
 * state" can open one directly instead of calling `createDraft`. A Location destination is
 * still never seeded (no `location` row exists in this db either) - tests that ship to a
 * Location keep inline-creating one via `__new__`; only the one seeded in-transit row ships
 * to a Site (an existing seeded site, reused as the destination).
 *
 * Every seeded test gets its own isolated OPFS copy (see `04-e2e-seeding.md`), so reusing
 * the same seeded transfer id across unrelated tests is safe - one test's edits never reach
 * another test's copy, even within the same spec file.
 */
export const seededTransfers = {
  /** draft, 1 line (John Carter's asset), no destination - generic read-only fixture. */
  draftReadOnlyA: { id: 'EJDN4S3IZUHJV4GU', name: 'TRF-004021-DB97' },
  /** draft, 1 line (John Carter's asset), no destination - dedicated to the ship-blocked case. */
  draftNoDestination: { id: '7E4541DP8Y15F844', name: 'TRF-004023-W324' },
  /** draft, 1 line (Michael Stone's asset), no destination - dedicated to ship-to-Location. */
  draftForShipToLocation: { id: '1I22ICGWIRGRZITY', name: 'TRF-004024-X19B' },
  /** draft, 1 line (John Wick's asset), no destination - dedicated to ship-to-Site. */
  draftForShipToSite: { id: 'WXIIHVTGFT8U8R6G', name: 'TRF-004025-MM1R' },
  /** draft, 1 line (John Wick's asset, starts with a siteId) - dedicated to receive-to-Location (proves siteId clears). */
  draftForReceiveToLocation: { id: 'BCM2QFGAE85MN7SZ', name: 'TRF-004026-YRJL' },
  /** draft, 1 line (Alice Morgan's asset), no destination - generic read-only fixture. */
  draftReadOnlyB: { id: 'N237YA2R5H5TYFXA', name: 'TRF-004027-FCNT' },
  /** draft, 1 line (Michael Stone's asset), no destination - dedicated to delete/cancel-delete. */
  draftForDelete: { id: '15S9UEPPTI43WGLD', name: 'TRF-004028-529Q' },
  /** draft, 1 line (Sarah Collin's asset, starts with a siteId) - dedicated to receive-to-Site (proves siteId overwrites). */
  draftForReceiveToSite: { id: 'D5UVH8RJYAFN2NDG', name: 'TRF-004029-9ZRF' },
  /** draft, 1 line (John Carter's asset), no destination - dedicated to the notes-edit case. */
  draftForEditNotes: { id: 'R89TBP3ZWN1YZT9Q', name: 'TRF-004030-5WR2' },
  /** draft, 2 lines (Sarah Collin's + Michael Stone's assets) - dedicated to multi-line cases (delete-one-line, multi-asset receive). */
  draftTwoLines: {
    id: 'SPDE7L59RXSJADVC',
    name: 'TRF-004031-WKBI',
    lines: { sarahCollin: 'J95BN4ZQ3NYD1D36', michaelStone: 'JFNF3K92QIKS8B8A' },
  },
  /** in_transit, 1 line (John Carter's asset), destination = a seeded Site, BOL already rendered and attached. */
  inTransitWithBol: { id: 'QZXAXAXXKQD2F8FR', name: 'TRF-004022-LI8R' },
} as const

/**
 * No seed DB seeds a Location (neither `asset.test.db` nor `transfer2.test.db` has a
 * `location` row) - every test that ships to a Location inline-creates one via the `toId`
 * reference field's `__new__` create flow.
 */
export const transferTestValues = {
  destinationNames: {
    location: () => `E2E Location ${generateId().slice(0, 8)}`,
    site: () => `E2E Site ${generateId().slice(0, 8)}`,
  },
} as const
