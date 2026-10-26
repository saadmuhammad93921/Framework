import { expect, test } from './fixtures';
import { AssetPage } from './pages/AssetPage';
import { TransferPage } from './pages/TransferPage';

// Automates the PASS-status cases from the Transfer manual test run (TC-TRANSFER-001, 002, 004,
// 005, 006, 008, 009, 012, 015). TC-TRANSFER-003 (BLOCKED) and TC-TRANSFER-007 (FAIL) are excluded
// per the automation-engineer instructions.
//
// Each test creates its own transfer/asset-line data in the shared QA workspace, independent of
// the others (per the manual run's own notes on self-containment). Ship/Receive tests each use a
// distinct pre-existing fixture asset (test 0001..test 0005) so concurrent runs never race on the
// same asset's Location/Site fields.

test.describe('Transfer', () => {
  test('TC-TRANSFER-001 create a draft transfer with direction, type, and one asset line', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0001', 'test 0001');
    await transferPage.save();

    await expect(page).toHaveTitle(/^Transfer: /);
    await expect(transferPage.stagesNav).toContainText('Draft');
    await expect(transferPage.assetLineButton('test 0001')).toBeVisible();
  });

  test('TC-TRANSFER-002 draft transfer appears in Transfers list with generated name and stage Draft', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0001', 'test 0001');
    await transferPage.save();
    const name = await transferPage.getRecordName();
    expect(name.length).toBeGreaterThan(0);

    await transferPage.gotoList();
    await transferPage.searchListFor(name);
    await expect(transferPage.rowForTransfer(name)).toContainText('Draft');
  });

  test('TC-TRANSFER-004 Ship is blocked with a validation error when no destination is set', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0001', 'test 0001');
    await transferPage.save();

    await transferPage.clickShipAction();
    await transferPage.submitShip();

    await expect(transferPage.shipDialog).toBeVisible();
    // role=alert uniquely identifies the actual validation message (the same text also appears
    // as a plain dropdown option label elsewhere in the dialog, which getByText alone would match too).
    await expect(transferPage.shipDialog.getByRole('alert', { name: 'To (type) is required' })).toBeVisible();
    await expect(transferPage.shipDialog.getByRole('alert', { name: 'To is required', exact: true })).toBeVisible();

    await transferPage.shipDialog.getByRole('button', { name: 'Close' }).click();
    // Ship stays unavailable-on-non-Draft gate proves the stage never advanced (R11): the Ship
    // action is only ever shown while the transfer is Draft.
    await expect(transferPage.shipActionLink).toBeVisible();
    await expect(transferPage.receiveActionLink).toBeHidden();
    await expect(transferPage.stagesNav).toContainText('Draft');
  });

  test('TC-TRANSFER-005 Ship succeeds and stage becomes In Transit after setting a Location destination', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0002', 'test 0002');
    await transferPage.save();
    const name = await transferPage.getRecordName();

    await transferPage.clickShipAction();
    await transferPage.setShipDestination('Location', 'Testing');
    await transferPage.submitShip();

    await expect(transferPage.shipDialog).toBeHidden();
    await expect(transferPage.stagesNav).toContainText('In Transit');
    await expect(transferPage.receiveActionLink).toBeVisible();
    await expect(transferPage.shipActionLink).toBeHidden();

    await transferPage.gotoList();
    await transferPage.searchListFor(name);
    await expect(transferPage.rowForTransfer(name)).toContainText('In Transit');
  });

  test('TC-TRANSFER-006 Ship succeeds and stage becomes In Transit after setting a Site destination', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0003', 'test 0003');
    await transferPage.save();
    await expect(transferPage.stagesNav).toContainText('Draft');
    const name = await transferPage.getRecordName();

    await transferPage.clickShipAction();
    await transferPage.setShipDestination('Site', 'Site For Transit');
    await transferPage.submitShip();

    await expect(transferPage.shipDialog).toBeHidden();
    await expect(transferPage.stagesNav).toContainText('In Transit');
    await expect(transferPage.receiveActionLink).toBeVisible();

    await transferPage.gotoList();
    await transferPage.searchListFor(name);
    await expect(transferPage.rowForTransfer(name)).toContainText('In Transit');
  });

  test('TC-TRANSFER-008 after Receive to a Location, the moved asset shows the new location and clears its site', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);
    const assetPage = new AssetPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0004', 'test 0004');
    await transferPage.save();

    await transferPage.clickShipAction();
    await transferPage.setShipDestination('Location', 'Testing');
    await transferPage.submitShip();
    await expect(transferPage.stagesNav).toContainText('In Transit');

    await transferPage.clickReceiveAction();
    await transferPage.submitReceive();
    await expect(transferPage.receiveDialog).toBeHidden();
    await expect(transferPage.stagesNav).toContainText('Received');

    await transferPage.openAssetLine('test 0004');
    await expect(page).toHaveTitle(/^Asset: /);
    await expect.poll(() => assetPage.getFieldText('Location')).toBe('Testing');
    await expect.poll(() => assetPage.getFieldText('Site')).toBe('—');
  });

  test('TC-TRANSFER-009 after Receive to a Site, the moved asset shows the new site and clears its location', async ({
    page,
  }) => {
    const transferPage = new TransferPage(page);
    const assetPage = new AssetPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.addAssetLine('test 0005', 'test 0005');
    await transferPage.save();

    await transferPage.clickShipAction();
    await transferPage.setShipDestination('Site', 'Site For Transit');
    await transferPage.submitShip();
    await expect(transferPage.stagesNav).toContainText('In Transit');

    await transferPage.clickReceiveAction();
    await transferPage.submitReceive();
    await expect(transferPage.receiveDialog).toBeHidden();
    await expect(transferPage.stagesNav).toContainText('Received');

    await transferPage.openAssetLine('test 0005');
    await expect(page).toHaveTitle(/^Asset: /);
    await expect.poll(() => assetPage.getFieldText('Site')).toBe('Site For Transit');
    await expect.poll(() => assetPage.getFieldText('Location')).toBe('—');
  });

  test('TC-TRANSFER-012 Receive action is not available on a Draft transfer', async ({ page }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.save();

    await expect(transferPage.stagesNav).toContainText('Draft');
    await expect(transferPage.shipActionLink).toBeVisible();
    await expect(transferPage.receiveActionLink).toBeHidden();
  });

  test('TC-TRANSFER-015 saving a draft transfer with zero lines succeeds', async ({ page }) => {
    const transferPage = new TransferPage(page);

    await transferPage.gotoList();
    await transferPage.openCreateForm();
    await transferPage.selectDirection('Outgoing');
    await transferPage.selectType('Shipment');
    await transferPage.save();

    await expect(page).toHaveTitle(/^Transfer: /);
    await expect(transferPage.stagesNav).toContainText('Draft');
    await expect(transferPage.transferItemsTable.getByRole('button')).toHaveCount(0);
  });
});
