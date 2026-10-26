// Usage: node scripts/tc-review.js <feature> < verdicts.json
// stdin: [{ "id": "TC-LOGIN-001", "status": "APPROVED|NEEDS-REVISION|REJECTED", "notes": "..." }, ...]
// Writes Review Status / Review Notes into the test case workbook.
const { fail, rel, xlsxPath, readStdinJson } = require('./lib/common');
const { load, save, summary } = require('./lib/workbook');

const VERDICTS = ['APPROVED', 'NEEDS-REVISION', 'REJECTED'];

async function main() {
  const feature = process.argv[2];
  if (!feature) fail('usage: node scripts/tc-review.js <feature> < verdicts.json');
  const loaded = await load(feature);
  if (!loaded) fail(`${rel(xlsxPath(feature))} does not exist yet.`);
  const { doc, images } = loaded;

  let verdicts = await readStdinJson();
  if (!Array.isArray(verdicts)) verdicts = verdicts.verdicts;
  if (!Array.isArray(verdicts) || !verdicts.length) fail('expected a non-empty JSON array of verdicts');

  const byId = new Map(doc.testCases.map((tc) => [tc.id, tc]));
  const errors = [];
  for (const v of verdicts) {
    if (!byId.has(v.id)) errors.push(`unknown test case ${v.id}`);
    if (!VERDICTS.includes(v.status)) errors.push(`${v.id}: status must be one of ${VERDICTS.join('/')}`);
    if (v.status !== 'APPROVED' && !(typeof v.notes === 'string' && v.notes.trim())) errors.push(`${v.id}: notes required for ${v.status}`);
  }
  if (errors.length) fail(`invalid verdicts:\n  - ${errors.join('\n  - ')}`);

  for (const v of verdicts) {
    const tc = byId.get(v.id);
    tc.reviewStatus = v.status;
    tc.reviewNotes = v.notes || '';
  }
  await save(doc, images);
  console.log(`Applied ${verdicts.length} verdicts to ${rel(xlsxPath(feature))}`);
  console.log(summary(doc));
}

main().catch((e) => fail(e.stack || e.message));
