/**
 * 개발 서버용 Mock API 미들웨어
 *
 * webpack-dev-server 의 setupMiddlewares 훅에서 등록해 사용합니다.
 * MSW 를 사용할 수 없는 환경이나 별도 API 서버 없이 프론트엔드를 개발할 때 활용합니다.
 *
 * 사용법:
 *   USE_MOCK=true pnpm serve:dev
 *   또는 pnpm serve:mock (package.json 스크립트)
 *
 * 핸들러 추가:
 *   handlers 배열에 { method, path, handler, delay? } 항목을 추가합니다.
 *   Express 라우팅 문법 그대로 사용합니다 (경로 파라미터 :id, 쿼리스트링 지원).
 */

// ── JSON 바디 파서 ────────────────────────────────────────────────────────────
// Express 의 express.json() 과 동일한 역할을 하는 경량 미들웨어입니다.
// POST / PUT / PATCH 요청에서 req.body 를 사용하기 위해 필요합니다.
// webpack-dev-server 에 express 의존성을 추가하지 않아도 동작합니다.
function jsonBodyParser(req, res, next) {
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    return next();
  }
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', () => {
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
    next();
  });
  req.on('error', () => {
    req.body = {};
    next();
  });
}

// ── 지연 유틸리티 ─────────────────────────────────────────────────────────────
// 실제 네트워크 지연을 시뮬레이션해 UI 로딩 상태를 검증하는 데 사용합니다.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Mock 데이터 ───────────────────────────────────────────────────────────────
const usersDb = [
  { id: 1, name: '홍길동', email: 'hong@example.com', role: 'admin' },
  { id: 2, name: '김철수', email: 'kim@example.com', role: 'user' },
  { id: 3, name: '이영희', email: 'lee@example.com', role: 'user' },
];

// ── 핸들러 정의 ───────────────────────────────────────────────────────────────
// method: HTTP 메서드 (GET | POST | PUT | PATCH | DELETE)
// path  : Express 라우팅 경로 (/api/users, /api/users/:id 등)
// handler(req, res): 응답 처리 함수
// delay : 응답 지연 ms (기본 0, 생략 가능)
const handlers = [
  {
    method: 'GET',
    path: '/api/users',
    delay: 200,
    handler(req, res) {
      const { role } = req.query;
      const result = role ? usersDb.filter((u) => u.role === role) : usersDb;
      res.json(result);
    },
  },
  {
    method: 'GET',
    path: '/api/users/:id',
    delay: 150,
    handler(req, res) {
      const user = usersDb.find((u) => u.id === Number(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    },
  },
  {
    method: 'POST',
    path: '/api/users',
    delay: 300,
    handler(req, res) {
      const { name, email, role = 'user' } = req.body ?? {};
      if (!name || !email) {
        return res.status(400).json({ error: 'name 과 email 은 필수입니다.' });
      }
      const newUser = { id: usersDb.length + 1, name, email, role };
      usersDb.push(newUser);
      res.status(201).json(newUser);
    },
  },
  {
    method: 'DELETE',
    path: '/api/users/:id',
    delay: 200,
    handler(req, res) {
      const idx = usersDb.findIndex((u) => u.id === Number(req.params.id));
      if (idx === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      const [deleted] = usersDb.splice(idx, 1);
      res.json(deleted);
    },
  },
];

// ── 등록 함수 ─────────────────────────────────────────────────────────────────
/**
 * webpack-dev-server 내부 Express 인스턴스에 Mock API 핸들러를 등록합니다.
 *
 * @param {import('express').Application} app webpack-dev-server 가 제공하는 Express 앱
 */
export function registerMockApi(app) {
  // /api 경로 전체에 JSON 바디 파싱 적용
  app.use('/api', jsonBodyParser);

  for (const { method, path, delay: ms = 0, handler } of handlers) {
    // 지연 래퍼: handler 를 async 로 감싸 delay 를 투명하게 적용합니다.
    app[method.toLowerCase()](path, async (req, res) => {
      if (ms > 0) await delay(ms);
      handler(req, res);
    });

    console.log(`  [mock-api] ${method.padEnd(6)} ${path}${ms ? `  (${ms}ms)` : ''}`);
  }
}
