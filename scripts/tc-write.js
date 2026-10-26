// Usage: node scripts/tc-write.js <feature> < test-cases.json
// stdin: { source, requirements, openQuestions, testCases } (see templates/data-formats.md)
// Creates or replaces data/outputs/1-test-cases/<feature>-test-cases.xlsx.
// Execution results and screenshots are kept for cases that stay APPROVED.
const { fail, rel, readStdinJson } = require('./lib/common');
const { load, save, summary, EXEC_KEYS } = require('./lib/workbook');

async function main() {
  const feature = process.argv[2];
  if (!feature) fail('usage: node scripts/tc-write.js <feature> < test-cases.json');
  const input = await readStdinJson();
  const existing = await load(feature);

  const images = {};
  const testCases = (input.testCases || []).map((tc) => {
    const out = { ...tc, reviewStatus: tc.reviewStatus || 'PENDING' };
    for (const k of [...EXEC_KEYS, 'hasScreenshot']) delete out[k];
    const old = existing && existing.doc.testCases.find((o) => o.id === tc.id);
    if (old && out.reviewStatus === 'APPROVED') {
      for (const k of EXEC_KEYS) if (old[k] !== undefined) out[k] = old[k];
      if (existing.images[tc.id]) images[tc.id] = existing.images[tc.id];
    }
    return out;
  });

  const prev = existing ? existing.doc : {};
  const doc = {
    feature,
    source: input.source,
    version: existing ? prev.version + 1 : 1,
    generatedAt: new Date().toISOString(),
    environment: prev.environment || '',
    figma: prev.figma || '',
    lastRunAt: prev.lastRunAt || '',
    requirements: input.requirements,
    openQuestions: input.openQuestions || [],
    testCases,
  };
  const file = await save(doc, images);
  console.log(`OK ${rel(file)} (version ${doc.version})`);
  console.log(summary(doc));
}

main().catch((e) => fail(e.stack || e.message));
