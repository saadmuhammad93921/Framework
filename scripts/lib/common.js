const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TC_DIR = path.join(ROOT, 'data', 'outputs', '1-test-cases');

const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const TYPES = ['Functional', 'UI', 'API', 'Security', 'Accessibility', 'Performance'];
const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'NEEDS-REVISION', 'REJECTED'];
const RESULT_STATUSES = ['PASS', 'FAIL', 'BLOCKED'];
const DESIGN_MATCHES = ['MATCH', 'MISMATCH', 'PARTIAL', 'N/A'];

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function xlsxPath(feature) {
  return path.join(TC_DIR, `${feature}-test-cases.xlsx`);
}

function readEnv(key) {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return '';
  const m = fs.readFileSync(file, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

function readStdinJson() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        fail(`stdin is not valid JSON: ${e.message}`);
      }
    });
  });
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isOptText = (v) => v === undefined || v === null || typeof v === 'string';

function validateDoc(doc) {
  const errors = [];
  const check = (cond, msg) => { if (!cond) errors.push(msg); };

  check(isText(doc.source), 'source: required (path of the input spec)');
  check(Array.isArray(doc.requirements) && doc.requirements.length > 0, 'requirements: non-empty array');
  check(Array.isArray(doc.openQuestions), 'openQuestions: array (may be empty)');
  check(Array.isArray(doc.testCases) && doc.testCases.length > 0, 'testCases: non-empty array');
  if (errors.length) return errors;

  const reqIds = new Set();
  doc.requirements.forEach((r, i) => {
    check(/^R\d+$/.test(r.id || ''), `requirements[${i}].id must look like R1`);
    check(!reqIds.has(r.id), `requirements[${i}]: duplicate id ${r.id}`);
    check(isText(r.text), `requirements[${i}].text required`);
    reqIds.add(r.id);
  });

  doc.openQuestions.forEach((q, i) => {
    check(/^Q\d+$/.test(q.id || ''), `openQuestions[${i}].id must look like Q1`);
    check(isText(q.question), `openQuestions[${i}].question required`);
    check(isOptText(q.assumptionUsed) && isOptText(q.answer), `openQuestions[${i}]: assumptionUsed/answer must be strings`);
    (q.relatedReqs || []).forEach((r) => check(reqIds.has(r), `openQuestions[${i}].relatedReqs: unknown requirement ${r}`));
  });

  const tcIds = new Set();
  doc.testCases.forEach((tc, i) => {
    const at = `testCases[${i}] (${tc.id || 'no id'})`;
    check(/^TC-[A-Z0-9]+(-[A-Z0-9]+)*-\d{3}$/.test(tc.id || ''), `${at}.id must look like TC-LOGIN-001`);
    check(!tcIds.has(tc.id), `${at}: duplicate id`);
    tcIds.add(tc.id);
    for (const f of ['title', 'module', 'role', 'preconditions', 'expectedResult']) {
      check(isText(tc[f]), `${at}.${f} required`);
    }
    check(PRIORITIES.includes(tc.priority), `${at}.priority must be one of ${PRIORITIES.join('/')}`);
    check(TYPES.includes(tc.type), `${at}.type must be one of ${TYPES.join('/')}`);
    check(Array.isArray(tc.steps) && tc.steps.length > 0 && tc.steps.every(isText), `${at}.steps: non-empty array of strings`);
    check(Array.isArray(tc.reqRefs) && tc.reqRefs.length > 0, `${at}.reqRefs: at least one requirement id`);
    (tc.reqRefs || []).forEach((r) => check(reqIds.has(r), `${at}.reqRefs: unknown requirement ${r}`));
    check(isOptText(tc.testData) && isOptText(tc.assumptions) && isOptText(tc.reviewNotes), `${at}: testData/assumptions/reviewNotes must be strings`);
    check(REVIEW_STATUSES.includes(tc.reviewStatus), `${at}.reviewStatus must be one of ${REVIEW_STATUSES.join('/')}`);
  });

  return errors;
}

function validateResult(r, tc) {
  const errors = [];
  const check = (cond, msg) => { if (!cond) errors.push(msg); };
  check(!!tc, `unknown test case ${r.id}`);
  check(RESULT_STATUSES.includes(r.status), `status must be one of ${RESULT_STATUSES.join('/')}`);
  check(isText(r.actualResult), 'actualResult required');
  check(DESIGN_MATCHES.includes(r.designMatch || 'N/A'), `designMatch must be one of ${DESIGN_MATCHES.join('/')}`);
  if (r.status !== 'BLOCKED') check(isText(r.screenshot), 'screenshot (path to the image file) required unless BLOCKED');
  if (r.status === 'FAIL') check(Number.isInteger(r.failedStep), 'failedStep (step number) required for FAIL');
  if (isText(r.screenshot)) {
    check(fs.existsSync(path.resolve(ROOT, r.screenshot)), `screenshot file ${r.screenshot} not found`);
    check(/\.(png|jpe?g)$/i.test(r.screenshot), 'screenshot must be .png or .jpeg');
  }
  return errors;
}

module.exports = {
  ROOT, TC_DIR, PRIORITIES, TYPES, REVIEW_STATUSES, RESULT_STATUSES, DESIGN_MATCHES,
  fail, rel, xlsxPath, readEnv, readStdinJson, validateDoc, validateResult,
};
