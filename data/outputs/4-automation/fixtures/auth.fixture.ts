import path from 'node:path';
import { test as base } from '@playwright/test';

// Reuses a manually-captured, authenticated Owner/Admin session instead of running the
// sign-in UI per test (ToolBerry sign-in has no password; a human types the emailed
// one-time code once, per context/automation-guide.md's "Auth" section).
const OWNER_ADMIN_STORAGE_STATE = path.join(
  __dirname,
  '..',
  '.auth',
  'owner-admin.json',
);

export const test = base.extend({
  storageState: OWNER_ADMIN_STORAGE_STATE,
});

export { expect } from '@playwright/test';
