// Usage: node scripts/tc-read.js <feature> [--summary] [--approved]
// Prints the test case workbook as JSON (screenshots shown as hasScreenshot: true/false).
//   --summary   only the counts
//   --approved  only test cases with reviewStatus APPROVED
const { fail, rel, xlsxPath } = require('./lib/common');
const { load, summary } = require('./lib/workbook');

async function main() {
  const [feature, ...flags] = process.argv.slice(2);
  if (!feature) fail('usage: node scripts/tc-read.js <feature> [--summary] [--approved]');
  const loaded = await load(feature);
  if (!loaded) fail(`${rel(xlsxPath(feature))} does not exist yet. Run the generate stage first.`);
  const { doc } = loaded;

  if (flags.includes('--summary')) {
    console.log(`${rel(xlsxPath(feature))} (version ${doc.version})`);
    console.log(summary(doc));
    return;
  }
  if (flags.includes('--approved')) doc.testCases = doc.testCases.filter((tc) => tc.reviewStatus === 'APPROVED');
  console.log(JSON.stringify(doc, null, 2));
}

main().catch((e) => fail(e.stack || e.message));
