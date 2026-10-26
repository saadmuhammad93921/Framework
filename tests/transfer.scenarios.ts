import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { transferConfig } from '@shared/core/entities/transfer/transfer.config'
import { transferItemConfig } from '@shared/core/entities/transfer/transferItem.config'

import { BaseScenarios } from '../../fixtures/base.scenarios'

const ITEMS_LIST = transferItemConfig.entity
const ITEM_FIELD = `${transferItemConfig.entity}-edit-schema-field`

export class TransferScenarios extends BaseScenarios<{ assetIds: string[] }> {
  constructor(page: Page) {
    super(page, {
      entity: transferConfig.entity,
      urlPattern: new RegExp(`/${transferConfig.entity}/([^/?#]+)`),
    })
  }

  async fillForm(data: { assetIds: string[] }): Promise<void> {
    for (const assetId of data.assetIds) {
      await this.setFieldValue(this.editFieldTestId('assetIds'), assetId)
    }
  }

  async expectItemInList(text: string): Promise<void> {
    const list = this.page.getByTestId(`${transferItemConfig.entity}-list-card`)
    await expect(list.getByText(text)).toBeVisible({ timeout: 10_000 })
  }

  // ============================================================
  // HEADER FIELDS (direction / type)
  // ============================================================

  /** Set the header `direction` SelectOption (fixed enum - see transferDirection.enum.ts). */
  async setDirection(value: string): Promise<void> {
    await this.setFieldValue(this.editFieldTestId('direction'), value)
  }

  /** Set the header `type` SelectOption (fixed enum - see transferType.enum.ts). */
  async setType(value: string): Promise<void> {
    await this.setFieldValue(this.editFieldTestId('type'), value)
  }

  /**
   * Full create flow: new transfer with the given direction/type and, optionally, one asset
   * line. Saves and opens the detail view. Returns the new transfer's id.
   */
  async createDraft(opts: {
    direction?: string
    type?: string
    assetIds?: string[]
  }): Promise<string> {
    await this.goto('/transfer')
    await this.navigateToList()
    await this.clickCreate()
    if (opts.direction) await this.setDirection(opts.direction)
    if (opts.type) await this.setType(opts.type)
    if (opts.assetIds?.length) await this.fillForm({ assetIds: opts.assetIds })
    await this.saveAndOpen()
    return this.getEntityId()
  }

  /** Open a pre-seeded transfer's detail view directly, skipping `createDraft`. */
  async openTransfer(id: string): Promise<void> {
    await this.goto(`/transfer/${id}`)
  }

  // ============================================================
  // SHIP / RECEIVE STAGE DIALOG
  // ============================================================

  /** TestId prefix for a field inside the open "ship" stage dialog's schema. */
  private shipFieldTestId(fieldName: string): string {
    return `${this.config.entity}-stage-ship-schema-field-${fieldName}`
  }

  /**
   * Set the destination shown inside the open Ship dialog (`toType` + `toId` - the ship
   * transition's own validation, transfer.stages.ts). `getStageSchemas` (transfer.store.ts)
   * injects these two fields into the ship dialog's own schema so a destination-less draft
   * can be shipped without failing on fields hidden on the main form; the dialog must
   * already be open (call after `clickStageAction('ship')`). `toId` is inline-created via
   * the `__new__` prefix (BaseScenarios.setFieldValue/createAndSetSelectField), since no
   * seed covers a Location/Site to ship to.
   */
  async setShipDestination(endpointType: 'location' | 'site', newName: string): Promise<void> {
    await this.setFieldValue(this.shipFieldTestId('toType'), endpointType)
    await this.setFieldValue(this.shipFieldTestId('toId'), `__new__${newName}`)
  }

  /** Click the Ship dialog's submit button without waiting for it to close (for the blocked-ship case). */
  async attemptShipSubmit(): Promise<void> {
    const btn = this.page.getByTestId(`${this.config.entity}-stage-ship-submit-main-btn`)
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await btn.click()
  }

  /** The Ship dialog is still open - the transition did not commit. */
  async expectShipDialogStillOpen(): Promise<void> {
    await expect(this.page.getByTestId(`${this.config.entity}-stage-ship-card`)).toBeVisible({
      timeout: 5_000,
    })
  }

  /**
   * Ship, then Receive, via the generic stage-action helpers (BaseScenarios).
   *
   * Overrides `BaseScenarios.clickStageAction` here: the primary stage action
   * renders through `AppButtonMain`, which appends `-btn` to its testId, so
   * the real DOM testid is `app-actions-${entity}-stage-${action}-btn`.
   */
  async clickStageAction(actionKey: string): Promise<void> {
    const action = this.page.getByTestId(
      `app-actions-${this.config.entity}-stage-${actionKey}-btn`,
    )
    await expect(action).toBeVisible({ timeout: 10_000 })
    await action.click()
  }

  async receive(): Promise<void> {
    await this.clickStageAction('receive')
    await this.confirmStageDialog('receive')
  }

  // ============================================================
  // STAGE ACTION VISIBILITY (actions menu must already be open - BaseScenarios.openRowActions/openActionsMenu)
  // ============================================================

  /**
   * Assert a stage action is visible in the open actions menu. No `-btn` suffix here:
   * that suffix is `AppButtonMain`'s (the hero header's primary CTA, see
   * `clickStageAction` above) - a dropdown menu item doesn't go through it.
   */
  async expectStageActionVisible(action: string): Promise<void> {
    const btn = this.page.getByTestId(`app-actions-${this.config.entity}-stage-${action}`)
    await expect(btn).toBeVisible({ timeout: 10_000 })
  }

  /** Assert a stage action is absent from the open actions menu. */
  async expectStageActionNotVisible(action: string): Promise<void> {
    const btn = this.page.getByTestId(`app-actions-${this.config.entity}-stage-${action}`)
    await expect(btn).toHaveCount(0)
  }

  // ============================================================
  // STAGE / LIST ASSERTIONS
  // ============================================================

  /**
   * Assert the open detail view's stage stepper shows the given stage as
   * the current step. The record view renders stage via `AppStageStepper`
   * (a progress bar), not a schema-field chip - testid pattern is
   * `${entity}-stage-stepper-${stageValue}`, with `aria-current="step"` on
   * the active step.
   */
  async expectTransferStage(stageValue: string): Promise<void> {
    const step = this.page.getByTestId(`${this.config.entity}-stage-stepper-${stageValue}`)
    await expect(step).toBeVisible({ timeout: 10_000 })
    await expect(step).toHaveAttribute('aria-current', 'step')
  }

  /** Assert a list row shows the given `transferStage` chip value (row must already be visible). */
  async expectListRowStage(id: string, stageValue: string): Promise<void> {
    await this.expectRowVisible(id)
    const chip = this.page.getByTestId(
      `${this.config.entity}-list-row-${id}-view-chip-${stageValue}`,
    )
    await expect(chip).toBeVisible({ timeout: 10_000 })
  }

  /** Assert a list row's name field shows the auto-generated "TRF-..." transaction name. */
  async expectListRowGeneratedName(id: string): Promise<void> {
    const nameField = this.page.getByTestId(`${this.config.entity}-list-row-${id}-field-name`)
    await expect(nameField).toBeVisible({ timeout: 10_000 })
    await expect(nameField).toContainText(/TRF-/)
  }

  // ============================================================
  // ASSET SIDE-EFFECTS (apply-on-receipt - see transfer.store.ts onStageChange)
  // ============================================================

  /**
   * After a receipt to a Location: the asset's own record resolves `locationId` to it, `siteId`
   * cleared. `locationId` is a plain top-level SelectReference field on asset (asset.store.ts
   * getBaseSchema), so its view testid follows the standard `-view-schema-field-...-view-reference`
   * pattern. NOTE: asset's `siteId` is rendered via a `Component` field (AppSite.vue), which uses a
   * DIFFERENT testid shape (`-view-schema-component-siteId-field-siteId...`) - see expectAssetAtSite.
   */
  async expectAssetAtLocation(assetId: string, locationName: string): Promise<void> {
    await this.goto(`/asset/${assetId}`)
    await this.expandRecordDetails('asset')
    const locationRef = this.page.getByTestId('asset-view-schema-field-locationId-view-reference')
    await expect(locationRef).toBeVisible({ timeout: 10_000 })
    await expect(locationRef).toContainText(locationName)
    await expect(
      this.page.getByTestId('asset-view-schema-component-siteId-field-siteId-view-reference'),
    ).toHaveCount(0)
  }

  /**
   * After a receipt to a Site: the asset's own record resolves `siteId` to it, `locationId`
   * cleared. Asset's `siteId` form/view field is a `Component` (AppSite.vue), not a plain
   * SelectReference - its testid follows the component-field shape (see editComponentFieldTestId
   * in BaseScenarios for the edit-form equivalent): `${entity}-view-schema-component-siteId-field-
   * siteId-view-reference`.
   */
  async expectAssetAtSite(assetId: string, siteName: string): Promise<void> {
    await this.goto(`/asset/${assetId}`)
    await this.expandRecordDetails('asset')
    const siteRef = this.page.getByTestId(
      'asset-view-schema-component-siteId-field-siteId-view-reference',
    )
    await expect(siteRef).toBeVisible({ timeout: 10_000 })
    await expect(siteRef).toContainText(siteName)
    await expect(
      this.page.getByTestId('asset-view-schema-field-locationId-view-reference'),
    ).toHaveCount(0)
  }

  // ============================================================
  // HEADER FIELDS (notes - use the inherited `updateField`/`expectFieldValue` for the edit
  // form itself; this one reads the record VIEW after a reload, which those don't cover)
  // ============================================================

  /** The record view (not the edit form) shows this value for `notes`, after a reload. */
  async expectNotesToBe(value: string): Promise<void> {
    const view = this.page.getByTestId(`${this.config.entity}-view-schema-field-notes`)
    await expect(view).toContainText(value, { timeout: 10_000 })
  }

  // ============================================================
  // HEADER DESTINATION (set directly on the main form, not the ship dialog)
  // ============================================================

  /** Set toType/toId directly on the open edit form - toType/toId are regular fields, not ship-dialog-only. */
  async setDestinationOnForm(endpointType: 'location' | 'site', newName: string): Promise<void> {
    await this.setFieldValue(this.editFieldTestId('toType'), endpointType)
    await this.setFieldValue(this.editFieldTestId('toId'), `__new__${newName}`)
  }

  // ============================================================
  // LINES (transferItem child list on the open record page)
  // ============================================================

  /** Add one asset line on the currently open transfer record page. */
  async addLine(assetId: string): Promise<void> {
    await this.page.getByTestId(`${ITEMS_LIST}-list-actions-create-button`).click()
    await this.setFieldValue(`${ITEM_FIELD}-assetId`, assetId)
    const save = this.page.getByTestId(`${transferItemConfig.entity}-edit-submit-main-btn`)
    await expect(save).toBeVisible({ timeout: 10_000 })
    await save.click()
    await expect(save).not.toBeVisible({ timeout: 10_000 })
  }

  /** Delete a line by its own transferItem id, confirming the delete dialog. */
  async deleteLine(lineId: string): Promise<void> {
    const actions = this.page.getByTestId(`${ITEMS_LIST}-list-row-${lineId}-actions-dropdown-button`)
    await expect(actions).toBeVisible({ timeout: 10_000 })
    await actions.click()
    const deleteBtn = this.page.getByTestId(`app-actions-${ITEMS_LIST}-actions-delete`)
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 })
    await deleteBtn.click()
    const okButton = this.page.getByTestId('confirm-dialog-ok-btn')
    await okButton.click()
    await expect(okButton).toHaveCount(0)
  }

  /** Assert a line for the given asset name is no longer in the list. */
  async expectLineNotInList(name: string): Promise<void> {
    const list = this.page.getByTestId(`${ITEMS_LIST}-list-card`)
    await expect(list.getByText(name)).toHaveCount(0)
  }

  // ============================================================
  // BOL ATTACHMENT (rendered/attached on ship - see transfer.store.ts afterTransition)
  // ============================================================

  /** Assert a Bill of Lading PDF is attached to the transfer and downloadable. */
  async expectBolAttachmentPresent(): Promise<void> {
    await this.expandRecordCard('attachment-list-card')
    const card = this.page.getByTestId('attachment-list-card')
    await expect(card).toBeVisible({ timeout: 10_000 })
    const rowActions = card
      .locator('[testid^="attachment-list-row-"][testid$="-actions-dropdown-button"]')
      .first()
    await expect(rowActions).toBeVisible({ timeout: 10_000 })
    await rowActions.click()
    await expect(this.page.getByTestId('app-actions-attachment-download').first()).toBeVisible({
      timeout: 10_000,
    })
  }

  // ============================================================
  // LIST SEARCH
  // ============================================================

  /** The name shown on a given list row (the auto-generated "TRF-..." name). */
  async getListRowName(id: string): Promise<string> {
    const nameField = this.page.getByTestId(`${this.config.entity}-list-row-${id}-field-name`)
    await expect(nameField).toBeVisible({ timeout: 10_000 })
    return (await nameField.textContent()) ?? ''
  }

  /**
   * Search the transfer list by name. Same chip-search pattern as customer/asset/workOrder
   * (`searchCustomerByName` / `searchAssetByName` / `searchWorkOrder`): DEV-914 hides the
   * search bar entirely at <=5 records, so give it a brief window and skip searching if it
   * never appears (the list is short enough that every record is already visible).
   */
  async searchTransferByName(name: string): Promise<void> {
    const tableSearch = this.page.getByTestId(`${this.config.entity}-list-table-search-search`)
    const itemsSearch = this.page.getByTestId(`${this.config.entity}-list-items-search-search`)
    const search = tableSearch.or(itemsSearch)
    try {
      await expect(search).toBeVisible({ timeout: 3_000 })
    } catch {
      return
    }
    await search.click()
    await search.fill(name)
    await this.page.keyboard.press('Enter')
  }

  // ============================================================
  // VIEWPORT
  // ============================================================

  /** Narrow viewport to exercise the mobile layout. */
  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 })
  }
}
