import { seededAssets } from '../asset/asset.testdata'
import { TransferScenarios } from './transfer.scenarios'
import { seededTransfers, transferTestValues } from './transfer.testdata'
import { test, expect } from '../../fixtures/test.fixture'

// `transfer2.test.db` seeds the same 5 assets as `asset.test.db` (same ids, for tests that
// build a transfer live) PLUS 11 pre-built transfer headers/lines (for tests that only need
// a transfer already in some state) - see `seededTransfers` in `transfer.testdata.ts` and
// `@docs/DEV-1375-transfers/04-e2e-seeding.md` for the full breakdown. Each test gets its own
// isolated OPFS copy of the seed, so reusing the same seeded id across unrelated tests is safe.
test.use({ seedFile: 'transfer2.test.db' })

test.describe('Transfer Module Flow', () => {
  // test('E2E-TRANSFER-001 should create a draft transfer with a direction, type and one asset line', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   const transferId = await transfer.createDraft({
  //     direction: 'incoming',
  //     type: 'relocation',
  //     assetIds: [seededAssets.johnCartersAsset.id],
  //   })

  //   expect(transferId).toBeTruthy()
  //   await transfer.expectTransferStage('draft')
  //   await transfer.expectItemInList(seededAssets.johnCartersAsset.name)
  // })

  // test('E2E-TRANSFER-002 draft transfer appears in the Transfers list with a generated name and a Draft stage indicator', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft - this test only reads list display, nothing to create.
  //   const { id: transferId } = seededTransfers.draftReadOnlyA

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.expectListRowGeneratedName(transferId)
  //   await transfer.expectListRowStage(transferId, 'draft')
  // })

  // test('E2E-TRANSFER-003 ship is blocked with a validation error when no destination is set', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft with no toType/toId set - exactly the precondition this case needs.
  //   await transfer.openTransfer(seededTransfers.draftNoDestination.id)

  //   await transfer.clickStageAction('ship')
  //   await transfer.attemptShipSubmit()
  //   // The ship transition requires toType/toId (transfer.stages.ts) - submitting without a
  //   // destination must not advance the stage: the dialog stays open.
  //   await transfer.expectShipDialogStillOpen()

  //   await transfer.pressEscape()
  //   await transfer.expectTransferStage('draft')
  // })

  // test('E2E-TRANSFER-004 ship succeeds to In Transit after setting a Location destination', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft, one line - only the ship transition itself needs to run live.
  //   await transfer.openTransfer(seededTransfers.draftForShipToLocation.id)

  //   await transfer.clickStageAction('ship')
  //   await transfer.setShipDestination('location', transferTestValues.destinationNames.location())
  //   await transfer.confirmStageDialog('ship')

  //   await transfer.expectTransferStage('in_transit')
  // })

  // test('E2E-TRANSFER-005 ship succeeds to In Transit after setting a Site destination', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   await transfer.openTransfer(seededTransfers.draftForShipToSite.id)

  //   await transfer.clickStageAction('ship')
  //   await transfer.setShipDestination('site', transferTestValues.destinationNames.site())
  //   await transfer.confirmStageDialog('ship')

  //   await transfer.expectTransferStage('in_transit')
  // })

  // test('E2E-TRANSFER-006 receive succeeds to Received after shipping to a Location, moving the asset there', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Seeded line's asset (John Wick's asset) already carries a starting siteId, so receiving
  //   // proves the overwrite (siteId cleared), not just an already-empty field staying empty.
  //   const assetId = seededAssets.johnWicksAsset.id
  //   await transfer.openTransfer(seededTransfers.draftForReceiveToLocation.id)

  //   const locationName = transferTestValues.destinationNames.location()
  //   await transfer.clickStageAction('ship')
  //   await transfer.setShipDestination('location', locationName)
  //   await transfer.confirmStageDialog('ship')
  //   await transfer.expectTransferStage('in_transit')

  //   await transfer.receive()
  //   await transfer.expectTransferStage('received')

  //   // Apply-on-receipt (transfer.store.ts onStageChange): the asset's own record now
  //   // resolves locationId to the shipped-to Location, with siteId cleared.
  //   await transfer.expectAssetAtLocation(assetId, locationName)
  // })

  // test('E2E-TRANSFER-007 receive succeeds to Received after shipping to a Site, moving the asset there', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Seeded line's asset (Sarah Collin's asset) already carries a starting siteId, so
  //   // receiving to a FRESH site proves the overwrite, not a coincidental match.
  //   const assetId = seededAssets.sarahCollinsAsset.id
  //   await transfer.openTransfer(seededTransfers.draftForReceiveToSite.id)

  //   const siteName = transferTestValues.destinationNames.site()
  //   await transfer.clickStageAction('ship')
  //   await transfer.setShipDestination('site', siteName)
  //   await transfer.confirmStageDialog('ship')
  //   await transfer.expectTransferStage('in_transit')

  //   await transfer.receive()
  //   await transfer.expectTransferStage('received')

  //   // Apply-on-receipt (transfer.store.ts onStageChange): the asset's own record now
  //   // resolves siteId to the shipped-to Site, with locationId cleared.
  //   await transfer.expectAssetAtSite(assetId, siteName)
  // })

  // test('E2E-TRANSFER-008 receive action is not available on a Draft transfer', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft - read-only check of the actions menu, nothing to create.
  //   const { id: transferId } = seededTransfers.draftReadOnlyB

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.openRowActions(transferId)
  //   await transfer.expectStageActionVisible('ship')
  //   await transfer.expectStageActionNotVisible('receive')
  // })

  // test('E2E-TRANSFER-009 saving a draft transfer with zero lines succeeds', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // No seeded fixture has zero lines - creating a zero-line draft is exactly what's under test.
  //   const transferId = await transfer.createDraft({
  //     direction: 'outgoing',
  //     type: 'shipment',
  //   })

  //   expect(transferId).toBeTruthy()
  //   await transfer.expectTransferStage('draft')

  //   const emptyList = page.getByTestId('transferItem-list-card')
  //   await expect(emptyList).toBeVisible({ timeout: 10_000 })
  // })

  // test('E2E-TRANSFER-010 editing notes on a draft transfer persists after reload', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft, dedicated to this edit - nothing else reads or mutates it.
  //   const { id: transferId } = seededTransfers.draftForEditNotes
  //   const updatedNotes = `E2E notes ${transferId}`

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.openRowActions(transferId)
  //   await transfer.clickEdit()
  //   await transfer.updateField('notes', updatedNotes)
  //   await transfer.saveChanges()
  //   await transfer.expectEditFormClosed()

  //   await transfer.goto(`/transfer/${transferId}`)
  //   await transfer.expectNotesToBe(updatedNotes)
  // })

  // test('E2E-TRANSFER-011 a shipped transfer has a Bill of Lading attached', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded in_transit transfer, already shipped with its BOL rendered and attached
  //   // (printAttachmentId set) - no ship step needed, this only reads the attachment card.
  //   await transfer.openTransfer(seededTransfers.inTransitWithBol.id)
  //   await transfer.expectTransferStage('in_transit')
  //   await transfer.expectBolAttachmentPresent()
  // })

  // test('E2E-TRANSFER-012 multi-asset receive moves every line atomically', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft with 2 lines (Sarah Collin's + Michael Stone's assets) - ship+receive
  //   // still run live, since the atomic multi-line write is exactly what's under test.
  //   const assetAId = seededAssets.sarahCollinsAsset.id
  //   const assetBId = seededAssets.michaelStonesAsset.id
  //   await transfer.openTransfer(seededTransfers.draftTwoLines.id)

  //   const locationName = transferTestValues.destinationNames.location()
  //   await transfer.clickStageAction('ship')
  //   await transfer.setShipDestination('location', locationName)
  //   await transfer.confirmStageDialog('ship')
  //   await transfer.expectTransferStage('in_transit')

  //   await transfer.receive()
  //   await transfer.expectTransferStage('received')

  //   // Apply-on-receipt applies every line in the same atomic group - both assets must land.
  //   await transfer.expectAssetAtLocation(assetAId, locationName)
  //   await transfer.expectAssetAtLocation(assetBId, locationName)
  // })

  // test('E2E-TRANSFER-013 received is terminal - no further stage actions', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Reuse the pre-shipped seeded transfer - only the receive transition needs to run live,
  //   // the ship step is already captured in the seed.
  //   const { id: transferId } = seededTransfers.inTransitWithBol
  //   await transfer.openTransfer(transferId)
  //   await transfer.expectTransferStage('in_transit')

  //   await transfer.receive()
  //   await transfer.expectTransferStage('received')

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.openRowActions(transferId)
  //   await transfer.expectStageActionNotVisible('ship')
  //   await transfer.expectStageActionNotVisible('receive')
  // })

  // test('E2E-TRANSFER-014 search for a transfer in the list shows only the match', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // The seed already has 11 transfers - well past DEV-914's >5-record search-bar threshold -
  //   // so no distractors need to be created live. Search for one seeded fixture by its name.
  //   const { id: targetId, name: targetName } = seededTransfers.draftReadOnlyA

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.searchTransferByName(targetName)

  //   await transfer.expectListRowGeneratedName(targetId)
  //   await expect(page.getByTestId(`transfer-list-row-${targetId}-field-name`)).toContainText(
  //     targetName,
  //   )
  // })

  // test('E2E-TRANSFER-015 delete a transfer, then cancel a delete', async ({ page }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // Pre-seeded draft, dedicated to delete/cancel-delete - it gets deleted by this test.
  //   const { id: transferId } = seededTransfers.draftForDelete

  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.openRowActions(transferId)
  //   await transfer.cancelDelete()
  //   await transfer.expectRowVisible(transferId)

  //   await transfer.openRowActions(transferId)
  //   await transfer.delete()
  //   await transfer.expectRowNotVisible(transferId)
  // })

  // test('E2E-TRANSFER-016 a transfer can be built up before its lines/endpoints are final', async ({
  //   page,
  // }) => {
  //   const transfer = new TransferScenarios(page)
  //   await page.pause()
  //   // No seeded fixture has zero lines - the header-first save is exactly what's under test.
  //   const transferId = await transfer.createDraft({
  //     direction: 'outgoing',
  //     type: 'shipment',
  //   })
  //   await transfer.expectTransferStage('draft')

  //   const locationName = transferTestValues.destinationNames.location()
  //   await transfer.goto('/transfer')
  //   await transfer.navigateToList()
  //   await transfer.openRowActions(transferId)
  //   await transfer.clickEdit()
  //   await transfer.setDestinationOnForm('location', locationName)
  //   await transfer.saveChanges()
  //   await transfer.expectEditFormClosed()

  //   await transfer.goto(`/transfer/${transferId}`)
  //   await transfer.addLine(seededAssets.johnCartersAsset.id)
  //   await transfer.expectItemInList(seededAssets.johnCartersAsset.name)
  // })

  test('E2E-TRANSFER-017 deleting a line removes only that line, not the header', async ({
    page,
  }) => {
    const transfer = new TransferScenarios(page)
    // Pre-seeded draft, already has 2 lines - nothing to create or add, just delete one by id.
    const { id: transferId, lines } = seededTransfers.draftTwoLines
    await transfer.openTransfer(transferId)
    await transfer.expectItemInList(seededAssets.michaelStonesAsset.name)
    await transfer.expectItemInList(seededAssets.sarahCollinsAsset.name)

    await transfer.deleteLine(lines.michaelStone)

    await transfer.expectLineNotInList(seededAssets.michaelStonesAsset.name)
    await transfer.expectItemInList(seededAssets.sarahCollinsAsset.name)
    expect(transfer.getEntityId()).toBe(transferId)
    await transfer.expectTransferStage('draft')
  })

})
