const test = require("node:test");
const assert = require("node:assert/strict");
const auditController = require("../src/controllers/audit.controller");
const curriculumQueries = require("../src/services/curriculum/curriculumQuery.service");
const { AuditResult } = require("../src/models");

function createRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test("listCurriculums delegates to curriculum query service", async () => {
  const expected = [{ id: 1, department: "應用數學系" }];
  const original = curriculumQueries.listCurriculums;
  curriculumQueries.listCurriculums = async () => expected;

  try {
    delete require.cache[require.resolve("../src/controllers/curriculums.controller")];
    const curriculumController = require("../src/controllers/curriculums.controller");
    const res = createRes();
    await curriculumController.listCurriculums({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, expected);
  } finally {
    curriculumQueries.listCurriculums = original;
    delete require.cache[require.resolve("../src/controllers/curriculums.controller")];
  }
});

test("listAuditHistory returns total count instead of page size", async () => {
  const original = AuditResult.findAndCountAll;
  AuditResult.findAndCountAll = async () => ({
    count: 7,
    rows: [{ id: 10 }, { id: 9 }]
  });

  try {
    const res = createRes();
    await auditController.listAuditHistory(
      { user: { id: 99, role: "admin" }, query: { userId: "1", limit: "2", offset: "0" } },
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.count, 7);
    assert.equal(res.body.rows.length, 2);
  } finally {
    AuditResult.findAndCountAll = original;
  }
});
