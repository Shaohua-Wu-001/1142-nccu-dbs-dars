import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    query_browsing: {
      executor: "constant-vus",
      exec: "queryBrowsing",
      vus: Number(__ENV.QUERY_VUS || 30),
      duration: __ENV.QUERY_DURATION || "45s"
    },
    audit_checking: {
      executor: "constant-vus",
      exec: "auditChecking",
      vus: Number(__ENV.AUDIT_VUS || 30),
      duration: __ENV.AUDIT_DURATION || "45s"
    },
    full_user_flow: {
      executor: "constant-vus",
      exec: "fullUserFlow",
      vus: Number(__ENV.FLOW_VUS || 1),
      duration: __ENV.FLOW_DURATION || "20s",
      startTime: __ENV.FLOW_START || "50s"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
    "http_req_duration{scenario:query_browsing}": ["p(95)<1000"],
    "http_req_duration{scenario:audit_checking}": ["p(95)<1500"],
    "http_req_duration{scenario:full_user_flow}": ["p(95)<3000"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const DEMO_USER_ID = __ENV.DEMO_USER_ID ? Number(__ENV.DEMO_USER_ID) : null;
const FULL_FLOW_USER_ID = __ENV.FULL_FLOW_USER_ID || __ENV.K6_USER_ID
  ? Number(__ENV.FULL_FLOW_USER_ID || __ENV.K6_USER_ID)
  : null;
const DEMO_ACADEMIC_YEAR = __ENV.DEMO_ACADEMIC_YEAR || "111";
const DEMO_ACCOUNT = __ENV.DEMO_ACCOUNT || "demo001";
const DEMO_PASSWORD = __ENV.DEMO_PASSWORD || "demo1234";
const K6_ACCOUNT = __ENV.K6_ACCOUNT || "k6demo";
const K6_PASSWORD = __ENV.K6_PASSWORD || "k6demo1234";
const transcript = JSON.parse(open("../data/transcript.json"));

function login(account, password) {
  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ account, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(response, { [`login ${account} is 200`]: (r) => r.status === 200 });
  return {
    token: String(response.json("token") || ""),
    userId: Number(response.json("user.id"))
  };
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export function setup() {
  const demo = login(DEMO_ACCOUNT, DEMO_PASSWORD);
  const k6 = login(K6_ACCOUNT, K6_PASSWORD);
  return {
    demoToken: demo.token,
    demoUserId: DEMO_USER_ID || demo.userId,
    k6Token: k6.token,
    fullFlowUserId: FULL_FLOW_USER_ID || k6.userId
  };
}

export function queryBrowsing(data) {
  const headers = authHeaders(data.demoToken);
  const demoUserId = data.demoUserId;
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { "health is 200": (r) => r.status === 200 });

  const courses = http.get(`${BASE_URL}/api/courses?year=${DEMO_ACADEMIC_YEAR}&limit=50`);
  check(courses, { "courses is 200": (r) => r.status === 200 });

  const requirements = http.get(`${BASE_URL}/api/curriculums/${DEMO_ACADEMIC_YEAR}/requirements`);
  check(requirements, { "requirements is 200": (r) => r.status === 200 });

  const history = http.get(`${BASE_URL}/api/audit/history?userId=${demoUserId}&limit=10`, { headers });
  check(history, { "history is 200": (r) => r.status === 200 });

  sleep(1);
}

export function auditChecking(data) {
  const headers = authHeaders(data.demoToken);
  const demoUserId = data.demoUserId;
  const audit = http.post(
    `${BASE_URL}/api/audit/run`,
    JSON.stringify({
      userId: demoUserId,
      academicYear: DEMO_ACADEMIC_YEAR,
      includeInProgress: false,
      saveResult: false
    }),
    { headers }
  );

  check(audit, {
    "audit is 200": (r) => r.status === 200,
    "audit is not saved": (r) => {
      try {
        return r.json("saved") === false;
      } catch (_error) {
        return false;
      }
    },
    "audit has official mode": (r) => {
      try {
        return r.json("mode") === "OFFICIAL";
      } catch (_error) {
        return false;
      }
    }
  });

  sleep(1);
}

export function fullUserFlow(data) {
  const headers = authHeaders(data.k6Token);
  const fullFlowUserId = data.fullFlowUserId;
  const importResponse = http.post(
    `${BASE_URL}/api/transcripts/import`,
    JSON.stringify({
      userId: fullFlowUserId,
      sourceFilename: "k6-transcript.json",
      transcript
    }),
    { headers }
  );
  check(importResponse, {
    "transcript import is 201": (r) => r.status === 201,
    "transcript imports courses": (r) => {
      try {
        return Number(r.json("importedCourses")) > 0;
      } catch (_error) {
        return false;
      }
    }
  });

  const audit = http.post(
    `${BASE_URL}/api/audit/run`,
    JSON.stringify({
      userId: fullFlowUserId,
      academicYear: DEMO_ACADEMIC_YEAR,
      includeInProgress: false,
      saveResult: true
    }),
    { headers }
  );
  check(audit, {
    "full flow audit is 201": (r) => r.status === 201,
    "full flow audit is saved": (r) => {
      try {
        return r.json("saved") === true;
      } catch (_error) {
        return false;
      }
    }
  });

  const history = http.get(`${BASE_URL}/api/audit/history?userId=${fullFlowUserId}&limit=1`, { headers });
  check(history, {
    "full flow history is 200": (r) => r.status === 200,
    "full flow history has row": (r) => {
      try {
        return Number(r.json("count")) >= 1;
      } catch (_error) {
        return false;
      }
    }
  });

  sleep(2);
}
