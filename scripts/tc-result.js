// Usage:
//   node scripts/tc-result.js <feature> --start        clear previous results, prints the APPROVED cases to run
//   node scripts/tc-result.js <feature> < result.json  record one result and embed its screenshot
// result.json: { "id", "status": "PASS|FAIL|BLOCKED", "actualResult", "failedStep", "notes",
//                "designMatch", "designNotes", "screenshot": ".tmp/TC-X.jpeg" }
// The screenshot file is embedded in the Screenshot column and then deleted.
const fs = require('fs');
const path = require('path');
const { ROOT, fail, rel, xlsxPath, readEnv, readStdinJson, validateResult } = require('./lib/common');
const { load, save, summary, EXEC_KEYS } = require('./lib/workbook');

async function start(feature, loaded) {
  const { doc } = loaded;
  for (const tc of doc.testCases) for (const k of EXEC_KEYS) delete tc[k];
  doc.environment = readEnv('APP_URL');
  doc.figma = readEnv('FIGMA_URL');
  doc.lastRunAt = new Date().toLocaleString();
  await save(doc, {});
  const approved = doc.testCases.filter((tc) => tc.reviewStatus === 'APPROVED');
  if (!approved.length) fail('no APPROVED test cases. Run the review stage first.');
  console.log(`Previous results cleared in ${rel(xlsxPath(feature))}`);
  console.log(`Environment: ${doc.environment || '(APP_URL not set)'} | Figma: ${doc.figma || 'none'}`);
  console.log(`APPROVED (${approved.length}): ${approved.map((tc) => tc.id).join(', ')}`);
}

async function record(feature, loaded) {
  const { doc, images } = loaded;
  const r = await readStdinJson();
  const tc = doc.testCases.find((t) => t.id === r.id);
  const errors = validateResult(r, tc);
  if (errors.length) fail(`invalid result for ${r.id}:\n  - ${errors.join('\n  - ')}`);

  tc.execStatus = r.status;
  tc.actualResult = r.actualResult;
  if (r.status === 'FAIL') tc.failedStep = r.failedStep; else delete tc.failedStep;
  tc.execNotes = r.notes || '';
  tc.designMatch = r.designMatch || 'N/A';
  tc.designNotes = r.designNotes || '';
  tc.executedAt = new Date().toLocaleString();

  let shotFile = null;
  if (r.screenshot) {
    shotFile = path.resolve(ROOT, r.screenshot);
    const ext = path.extname(shotFile).slice(1).toLowerCase();
    images[tc.id] = { buffer: fs.readFileSync(shotFile), extension: ext === 'jpg' ? 'jpeg' : ext };
  } else {
    delete images[tc.id];
  }

  await save(doc, images);
  if (shotFile) fs.rmSync(shotFile, { force: true });
  const done = doc.testCases.filter((t) => t.execStatus).length;
  const todo = doc.testCases.filter((t) => t.reviewStatus === 'APPROVED').length;
  console.log(`${tc.id}: ${r.status} recorded (${done}/${todo} done)`);
}

async function main() {
  const [feature, flag] = process.argv.slice(2);
  if (!feature) fail('usage: node scripts/tc-result.js <feature> [--start] < result.json');
  const loaded = await load(feature);
  if (!loaded) fail(`${rel(xlsxPath(feature))} does not exist yet.`);
  if (flag === '--start') return start(feature, loaded);
  if (flag === '--summary') return console.log(summary(loaded.doc));
  return record(feature, loaded);
}

main().catch((e) => fail(e.stack || e.message));
