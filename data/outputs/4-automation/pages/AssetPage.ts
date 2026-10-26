import type { Page } from '@playwright/test';

/**
 * Minimal page object for an Asset record page - just enough to read the Location/Site
 * field values that TC-TRANSFER-008/009 assert on after a Receive moves the asset.
 */
export class AssetPage {
  constructor(private readonly page: Page) {}

  /**
   * Reads a labeled field's value, e.g. getFieldText('Location') -> 'Testing' or '—' (empty).
   * Field rows render as a single container with the label text then the value (as a button
   * when set, or a plain '—' dash when empty) - there is no role or testid distinguishing the
   * value from its label, so this falls back to reading the label's parent container's text
   * and stripping the label (last resort per the guide's locator strategy, documented here).
   */
  async getFieldText(label: string): Promise<string> {
    const container = this.page.getByText(label, { exact: true }).locator('xpath=..');
    const full = (await container.textContent()) ?? '';
    return full.replace(label, '').trim();
  }
}
