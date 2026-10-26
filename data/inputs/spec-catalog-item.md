# Spec: Create a Catalog Item

Small feature to pilot the QA pipeline end to end.

## Feature

Service Catalog lets an Owner/Admin create reusable catalog items (parts/services with a price
and cost) from the main sidebar, outside of Settings.

## Requirements

1. The sidebar has a "Service Catalog" entry, separate from Settings.
2. From Service Catalog, a user can create a new catalog item with at least: name, a price, and a
   cost.
3. After saving, the new catalog item appears in the Service Catalog list.
4. Opening the saved catalog item shows the same name, price, and cost that were entered.
5. The price and cost fields accept decimal values (e.g. 12.50).

## Role

Owner/Admin only for this pass (`ROLE_OWNER_ADMIN_EMAIL` / `ROLE_OWNER_ADMIN_PASSWORD`). Sign-in
uses an emailed one-time code; the user will type that code in manually when prompted mid-run.

## Out of scope for this pass

- Editing or deleting an existing catalog item.
- Using the catalog item on a job/part (that's a separate, larger flow).
- Any other role.
