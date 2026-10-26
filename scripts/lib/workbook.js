const fs = require('fs');
const ExcelJS = require('exceljs');
const { xlsxPath, rel, fail, validateDoc } = require('./common');

const TC_COLUMNS = [
  { header: 'TC ID', key: 'id', width: 18 },
  { header: 'Title', key: 'title', width: 36 },
  { header: 'Module', key: 'module', width: 13 },
  { header: 'Priority', key: 'priority', width: 9 },
  { header: 'Type', key: 'type', width: 12 },
  { header: 'Role', key: 'role', width: 15 },
  { header: 'Req Refs', key: 'reqRefs', width: 11 },
  { header: 'Preconditions', key: 'preconditions', width: 30 },
  { header: 'Steps', key: 'steps', width: 50 },
  { header: 'Expected Result', key: 'expectedResult', width: 40 },
  { header: 'Test Data', key: 'testData', width: 24 },
  { header: 'Assumptions', key: 'assumptions', width: 28 },
  { header: 'Review Status', key: 'reviewStatus', width: 15 },
  { header: 'Review Notes', key: 'reviewNotes', width: 32 },
  { header: 'Execution Status', key: 'execStatus', width: 12 },
  { header: 'Actual Result', key: 'actualResult', width: 40 },
  { header: 'Failed Step', key: 'failedStep', width: 9 },
  { header: 'Execution Notes', key: 'execNotes', width: 30 },
  { header: 'Design Match', key: 'designMatch', width: 12 },
  { header: 'Design Notes', key: 'designNotes', width: 30 },
  { header: 'Executed At', key: 'executedAt', width: 17 },
  { header: 'Screenshot', key: 'screenshot', width: 46 },
];
const EXEC_KEYS = ['execStatus', 'actualResult', 'failedStep', 'execNotes', 'designMatch', 'designNotes', 'executedAt'];
const SHOT_COL = TC_COLUMNS.findIndex((c) => c.key === 'screenshot');
const SHOT_W = 320;
const SHOT_H = 180;

const FILLS = {
  header: 'FF1F3864',
  APPROVED: 'FFC6EFCE', PASS: 'FFC6EFCE', MATCH: 'FFC6EFCE',
  'NEEDS-REVISION': 'FFFFEB9C', PARTIAL: 'FFFFEB9C', BLOCKED: 'FFFFEB9C',
  REJECTED: 'FFFFC7CE', FAIL: 'FFFFC7CE', MISMATCH: 'FFFFC7CE', UNCOVERED: 'FFFFC7CE',
};

const fill = (cell, argb) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }; };

function styleSheet(ws, statusKeys = []) {
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).eachCell((c) => fill(c, FILLS.header));
  ws.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true }; });
  if (ws.rowCount > 1) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  for (const key of statusKeys) {
    ws.getColumn(key).eachCell((c, rowNo) => { if (rowNo > 1 && FILLS[c.value]) fill(c, FILLS[c.value]); });
  }
}

// Read a sheet into objects keyed by the column keys of `columns` (matched on header text).
function readSheet(ws, columns) {
  if (!ws) return [];
  const byHeader = Object.fromEntries(columns.map((c) => [c.header, c.key]));
  const keyAt = {};
  ws.getRow(1).eachCell((cell, col) => { if (byHeader[cell.text]) keyAt[col] = byHeader[cell.text]; });
  const rows = [];
  ws.eachRow((row, rowNo) => {
    if (rowNo === 1) return;
    const obj = { _row: rowNo };
    for (const [col, key] of Object.entries(keyAt)) obj[key] = row.getCell(Number(col)).text.trim();
    if (Object.values(obj).some((v, i) => i > 0 && v)) rows.push(obj);
  });
  return rows;
}

const REQ_COLUMNS = [
  { header: 'Req ID', key: 'id', width: 9 },
  { header: 'Requirement', key: 'text', width: 70 },
  { header: 'Covered By', key: 'coveredBy', width: 50 },
  { header: 'Coverage', key: 'coverage', width: 12 },
];
const Q_COLUMNS = [
  { header: 'Q ID', key: 'id', width: 8 },
  { header: 'Question', key: 'question', width: 60 },
  { header: 'Related Reqs', key: 'relatedReqs', width: 14 },
  { header: 'Assumption Used', key: 'assumptionUsed', width: 45 },
  { header: 'Answer', key: 'answer', width: 45 },
];
const ABOUT_KEYS = [
  ['Feature', 'feature'], ['Source', 'source'], ['Version', 'version'], ['Generated', 'generatedAt'],
  ['Environment', 'environment'], ['Figma', 'figma'], ['Last run', 'lastRunAt'],
];

const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

/** Returns { doc, images } or null when the file doesn't exist. images: { [tcId]: { buffer, extension } } */
async function load(feature) {
  const file = xlsxPath(feature);
  if (!fs.existsSync(file)) return null;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(file);
  } catch (e) {
    fail(`cannot read ${rel(file)}: ${e.message}`);
  }

  const doc = { feature };
  const about = wb.getWorksheet('About');
  if (about) {
    about.eachRow((row, n) => {
      if (n === 1) return;
      const pair = ABOUT_KEYS.find(([label]) => label === row.getCell(1).text);
      if (pair) doc[pair[1]] = row.getCell(2).text.trim();
    });
  }
  doc.version = Number(doc.version) || 1;

  doc.requirements = readSheet(wb.getWorksheet('Requirements'), REQ_COLUMNS).map((r) => ({ id: r.id, text: r.text }));
  doc.openQuestions = readSheet(wb.getWorksheet('Open Questions'), Q_COLUMNS).map((q) => ({
    id: q.id, question: q.question, relatedReqs: list(q.relatedReqs), assumptionUsed: q.assumptionUsed, answer: q.answer,
  }));

  const ws = wb.getWorksheet('Test Cases');
  const rows = readSheet(ws, TC_COLUMNS);
  const idByRow = {};
  doc.testCases = rows.map((r) => {
    idByRow[r._row] = r.id;
    const tc = {
      id: r.id, title: r.title, module: r.module, priority: r.priority, type: r.type, role: r.role,
      reqRefs: list(r.reqRefs), preconditions: r.preconditions,
      steps: r.steps.split('\n').map((s) => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean),
      expectedResult: r.expectedResult, testData: r.testData, assumptions: r.assumptions,
      reviewStatus: r.reviewStatus || 'PENDING', reviewNotes: r.reviewNotes,
    };
    for (const k of EXEC_KEYS) if (r[k]) tc[k] = k === 'failedStep' ? Number(r[k]) : r[k];
    return tc;
  });

  const images = {};
  for (const img of ws ? ws.getImages() : []) {
    const id = idByRow[img.range.tl.nativeRow + 1];
    const media = wb.getImage(Number(img.imageId));
    if (id && media) images[id] = { buffer: media.buffer, extension: media.extension };
  }
  for (const tc of doc.testCases) tc.hasScreenshot = !!images[tc.id];
  return { doc, images };
}

async function save(doc, images = {}) {
  const errors = validateDoc(doc);
  if (errors.length) fail(`test case data is invalid:\n  - ${errors.join('\n  - ')}`);

  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet('Test Cases');
  ws.columns = TC_COLUMNS;
  for (const tc of doc.testCases) {
    ws.addRow({
      ...tc,
      reqRefs: tc.reqRefs.join(', '),
      steps: tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      screenshot: '',
    });
  }
  styleSheet(ws, ['reviewStatus', 'execStatus', 'designMatch']);
  doc.testCases.forEach((tc, i) => {
    const img = images[tc.id];
    if (!img) return;
    const imageId = wb.addImage({ buffer: img.buffer, extension: img.extension });
    ws.addImage(imageId, { tl: { col: SHOT_COL, row: i + 1 }, ext: { width: SHOT_W, height: SHOT_H }, editAs: 'oneCell' });
    ws.getRow(i + 2).height = Math.max(SHOT_H * 0.75 + 4, ws.getRow(i + 2).height || 0);
  });

  const coveredBy = {};
  for (const tc of doc.testCases) for (const r of tc.reqRefs) (coveredBy[r] ||= []).push(tc.id);
  const rs = wb.addWorksheet('Requirements');
  rs.columns = REQ_COLUMNS;
  for (const r of doc.requirements) {
    const ids = coveredBy[r.id] || [];
    rs.addRow({ id: r.id, text: r.text, coveredBy: ids.join(', '), coverage: ids.length || 'UNCOVERED' });
  }
  styleSheet(rs, ['coverage']);

  const qs = wb.addWorksheet('Open Questions');
  qs.columns = Q_COLUMNS;
  for (const q of doc.openQuestions) qs.addRow({ ...q, relatedReqs: (q.relatedReqs || []).join(', ') });
  styleSheet(qs);

  const count = (key, val) => doc.testCases.filter((tc) => tc[key] === val).length;
  const executed = count('execStatus', 'PASS') + count('execStatus', 'FAIL');
  const about = wb.addWorksheet('About');
  about.columns = [{ header: 'Item', key: 'k', width: 22 }, { header: 'Value', key: 'v', width: 80 }];
  for (const [label, key] of ABOUT_KEYS) about.addRow({ k: label, v: doc[key] ?? '' });
  [
    ['Test cases', doc.testCases.length],
    ['Approved', count('reviewStatus', 'APPROVED')],
    ['Passed', count('execStatus', 'PASS')],
    ['Failed', count('execStatus', 'FAIL')],
    ['Blocked', count('execStatus', 'BLOCKED')],
    ['Pass rate (executed)', executed ? `${Math.round((count('execStatus', 'PASS') / executed) * 100)}%` : ''],
  ].forEach(([k, v]) => about.addRow({ k, v }));
  styleSheet(about);

  const file = xlsxPath(doc.feature);
  fs.mkdirSync(require('path').dirname(file), { recursive: true });
  try {
    await wb.xlsx.writeFile(file);
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') fail(`${rel(file)} is open in another program (Excel?). Close it and re-run.`);
    throw e;
  }
  return file;
}

function summary(doc) {
  const tally = (key) => Object.entries(doc.testCases.reduce((acc, tc) => {
    if (tc[key]) acc[tc[key]] = (acc[tc[key]] || 0) + 1;
    return acc;
  }, {})).map(([k, v]) => `${k}=${v}`).join(' ') || 'none';
  const covered = new Set(doc.testCases.flatMap((tc) => tc.reqRefs));
  const uncovered = doc.requirements.filter((r) => !covered.has(r.id)).map((r) => r.id);
  return [
    `Test cases: ${doc.testCases.length} | ${tally('priority')}`,
    `Review: ${tally('reviewStatus')}`,
    `Execution: ${tally('execStatus')}`,
    `Requirements: ${doc.requirements.length} | uncovered: ${uncovered.length ? uncovered.join(', ') : 'none'}`,
    `Open questions: ${doc.openQuestions.length} (unanswered: ${doc.openQuestions.filter((q) => !q.answer).length})`,
  ].join('\n');
}

module.exports = { load, save, summary, EXEC_KEYS };
