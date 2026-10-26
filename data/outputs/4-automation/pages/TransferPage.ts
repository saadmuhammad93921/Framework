import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type TransferDirection = 'Outgoing' | 'Incoming';
export type TransferType = 'Shipment' | 'Relocation' | 'Return';
export type DestinationType = 'Location' | 'Site';

/**
 * Page object for the Transfer module: the Transfers list, the create/edit form, and the
 * record page (Stages nav, Ship/Receive dialogs, Transfer Items section).
 *
 * No assertions live here - only locators (as getters) and actions, per
 * context/automation-guide.md's page-object pattern.
 */
export class TransferPage {
  constructor(private readonly page: Page) {}

  // ---- Sidebar navigation ----
  get transfersNavItem(): Locator {
    return this.page.getByRole('complementary').getByText('Transfers', { exact: true });
  }

  // ---- Transfers list ----
  get newTransferLink(): Locator {
    // exact: true - otherwise this also matches "New Transfer Item" (substring) once a record
    // page with a Transfer Items section is also present in the accessible tree.
    return this.page.getByRole('main').getByRole('link', { name: 'New Transfer', exact: true });
  }

  get listSearchRecordsCombobox(): Locator {
    return this.page.getByRole('main').getByRole('combobox', { name: 'Search records' });
  }

  rowForTransfer(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  // ---- Create/edit form ----
  get directionRadiogroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'Direction' });
  }

  get typeRadiogroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'Type' });
  }

  get assetsCombobox(): Locator {
    return this.page.getByRole('combobox', { name: 'Assets' });
  }

  get saveAndOpenButton(): Locator {
    return this.page.getByRole('button', { name: 'Save & Open' });
  }

  // ---- Record page ----
  get stagesNav(): Locator {
    return this.page.getByRole('navigation', { name: 'Stages' });
  }

  get shipActionLink(): Locator {
    return this.page.getByRole('link', { name: 'Ship', exact: true });
  }

  get receiveActionLink(): Locator {
    return this.page.getByRole('link', { name: 'Receive', exact: true });
  }

  get transferItemsTable(): Locator {
    return this.page.locator('table', {
      has: this.page.getByRole('columnheader', { name: 'Asset' }),
    });
  }

  assetLineButton(assetName: string): Locator {
    return this.transferItemsTable.getByRole('button', { name: assetName, exact: true });
  }

  // ---- Ship dialog ----
  get shipDialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Ship:/ });
  }

  get shipDialogToTypeRadiogroup(): Locator {
    return this.shipDialog.getByRole('radiogroup', { name: 'To (type)' });
  }

  get shipDialogSubmitButton(): Locator {
    return this.shipDialog.getByRole('button', { name: 'Ship', exact: true });
  }

  // ---- Receive dialog ----
  get receiveDialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Receive:/ });
  }

  get receiveDialogSubmitButton(): Locator {
    return this.receiveDialog.getByRole('button', { name: 'Receive', exact: true });
  }

  // ---- Actions ----

  /** Navigate to the Transfers list via the sidebar. The one exception to "never goto a deep
   * page" (see the guide's "Known risks" section) is the very first navigation of a test: the
   * page starts blank, so it must load the authenticated app's root once before any sidebar
   * link exists to click - baseURL ('/') is not a deep record path, so it is not subject to the
   * SPA session-drop risk the guide warns about. */
  async gotoList() {
    if (!/\/w\//.test(this.page.url())) {
      await this.page.goto('/');
      await expect(this.transfersNavItem).toBeVisible({ timeout: 15000 });
    }
    await this.transfersNavItem.click();
    await expect(this.newTransferLink).toBeVisible();
  }

  /** Open the create-transfer form from the Transfers list. */
  async openCreateForm() {
    await this.newTransferLink.click();
    // The create dialog gates on the fresh context's offline-first sync completing before any
    // field (including static ones like Direction) mounts - this can take a while against a live
    // workspace right after a storageState reload, well past the "Loading..." placeholder's first
    // couple of seconds.
    await expect(this.directionRadiogroup).toBeVisible({ timeout: 60000 });
  }

  async selectDirection(direction: TransferDirection) {
    await this.directionRadiogroup.getByRole('radio', { name: direction }).click();
  }

  async selectType(type: TransferType) {
    await this.typeRadiogroup.getByRole('radio', { name: type }).click();
  }

  /** Adds one asset line by typing into the Assets combobox and picking the first matching
   * option (excluding the "New Asset" create shortcut). */
  async addAssetLine(searchTerm: string, optionName: string) {
    await this.assetsCombobox.click();
    await this.assetsCombobox.fill(searchTerm);
    // Option accessible names are prefixed with a 2-letter avatar badge (e.g. "TO test 0002 R-2
    // Active"), so match on the asset name appearing anywhere rather than anchoring at the start.
    const option = this.page.getByRole('option', { name: optionName }).first();
    await expect(option).toBeVisible();
    await option.click();
  }

  async save() {
    await this.saveAndOpenButton.click();
  }

  /** Reads the generated transfer name from the page title ("Transfer: TRF-xxx - ..."),
   * set once the record page has loaded after Save & Open. */
  async getRecordName(): Promise<string> {
    await expect(this.page).toHaveTitle(/^Transfer: /);
    const title = await this.page.title();
    const match = title.match(/^Transfer: (\S+)/);
    if (!match) {
      throw new Error(`Could not parse transfer name from page title "${title}"`);
    }
    return match[1];
  }

  async clickShipAction() {
    await this.shipActionLink.click();
    await expect(this.shipDialog).toBeVisible();
  }

  async clickReceiveAction() {
    await this.receiveActionLink.click();
    await expect(this.receiveDialog).toBeVisible();
  }

  /** Sets the Ship dialog's destination. The "To" reference field renders as a radiogroup
   * when few records exist, or a combobox when many do (per the guide) - this handles both. */
  async setShipDestination(destinationType: DestinationType, destinationName: string) {
    await this.shipDialogToTypeRadiogroup.getByRole('radio', { name: destinationType }).click();

    const toRadiogroup = this.shipDialog.getByRole('radiogroup', { name: 'To', exact: true });
    const toCombobox = this.shipDialog.getByRole('combobox', { name: 'To', exact: true });
    await expect(toRadiogroup.or(toCombobox)).toBeVisible();

    if (await toRadiogroup.isVisible()) {
      await toRadiogroup.getByRole('radio', { name: destinationName }).click();
      return;
    }
    await toCombobox.click();
    await toCombobox.fill(destinationName);
    // Options carry a 2-letter avatar badge prefix and often an address suffix (e.g.
    // "ST Site For Transit Lahore, Punjab, Pakistan, Lahore, PB"), so the accessible name is
    // never exactly destinationName - match it as a substring instead (no `exact`).
    await this.shipDialog.getByRole('option', { name: destinationName }).first().click();
  }

  async submitShip() {
    await this.shipDialogSubmitButton.click();
  }

  async submitReceive() {
    await this.receiveDialogSubmitButton.click();
  }

  /** Navigates from the transfer record page to the asset's own record page by clicking its
   * line in the Transfer Items section. */
  async openAssetLine(assetName: string) {
    await this.assetLineButton(assetName).click();
  }

  /** Filters the Transfers list down to one record by name. The list is not fully rendered in
   * the DOM at once (the placeholder reads "Search... (press enter to submit)"), so a plain
   * Playwright-side row filter can miss rows below the initially-rendered window - the app's own
   * search must be used and submitted with Enter. */
  async searchListFor(name: string) {
    await this.listSearchRecordsCombobox.click();
    await this.listSearchRecordsCombobox.fill(name);
    await this.listSearchRecordsCombobox.press('Enter');
    await expect(this.rowForTransfer(name)).toBeVisible();
  }
}
