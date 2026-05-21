const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { User } = require("../src/models");
const {
  canAccessUser,
  requireAuth,
  requireAdmin,
  resolveTargetUserId
} = require("../src/middleware/auth.middleware");

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

test("canAccessUser allows admins and matching student owners only", () => {
  assert.equal(canAccessUser({ user: { id: 1, role: "admin" } }, 99), true);
  assert.equal(canAccessUser({ user: { id: 7, role: "student" } }, 7), true);
  assert.equal(canAccessUser({ user: { id: 7, role: "student" } }, 8), false);
});

test("resolveTargetUserId ignores spoofed student userId but keeps admin target userId", () => {
  assert.equal(resolveTargetUserId({ user: { id: 7, role: "student" } }, { userId: 8 }), 7);
  assert.equal(resolveTargetUserId({ user: { id: 1, role: "admin" } }, { userId: 8 }), 8);
});

test("requireAdmin rejects non-admin users", () => {
  const res = createRes();
  let nextCalled = false;
  requireAdmin({ user: { id: 7, role: "student" } }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Admin access required" });
});

test("requireAuth refreshes role from the database instead of trusting token role", async () => {
  const originalFindByPk = User.findByPk;
  User.findByPk = async () => ({
    get: () => ({
      id: 7,
      student_number: "DEMO007",
      username: "student7",
      name: "Student",
      email: "student@example.com",
      admission_year: 111,
      role: "student"
    })
  });

  try {
    const token = jwt.sign({ id: 7, email: "admin@example.com", role: "admin" }, "nccu-ams-dev-secret");
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.role, "student");
    assert.equal(req.user.id, 7);
  } finally {
    User.findByPk = originalFindByPk;
  }
});
