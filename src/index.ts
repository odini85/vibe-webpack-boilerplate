import './styles/main.scss';

// webpack이 빌드 시점에 파일을 assets/media/ 로 출력하고 URL 문자열로 치환합니다.
import sampleVideoSrc from './assets/videos/sample.mp4';

// 렌더 타깃 루트의 기본 id
// 환경별로 변경이 필요하면 renderApp 호출 시 override
const DEFAULT_ROOT_ID = 'root';

/**
 * 카운터 UI를 생성한다.
 * @param initialCount 초기 카운트 값
 * @returns 카운터 DOM 컨테이너
 */
export function createApp(initialCount = 0): HTMLDivElement {
  const app = document.createElement('div');
  app.className = 'app';
  const appName = process.env.APP_NAME || 'webpack-boilerplate';
  const appEnv = process.env.APP_ENV || 'dev';

  // 현재 카운트 값을 보관
  // UI와 상태를 동기화하는 용도로만 사용
  let count = initialCount;

  const heading = document.createElement('h1');
  heading.textContent = '간단한 카운터';

  const description = document.createElement('p');
  description.textContent = '버튼을 눌러 숫자가 증가하는지 확인해 보세요.';

  const value = document.createElement('div');
  value.className = 'counter-value';
  value.textContent = count.toString();

  const incrementBtn = document.createElement('button');
  incrementBtn.type = 'button';
  incrementBtn.textContent = '+1';

  // DefinePlugin으로 치환된 APP_* 값을 화면에 노출해 환경 주입 결과를 바로 확인한다.
  const envInfo = document.createElement('p');
  envInfo.className = 'env-info';
  envInfo.textContent = `앱: ${appName} | 환경: ${appEnv}`;

  // 버튼 클릭 시 카운트를 1 증가시킨다.
  incrementBtn.addEventListener('click', () => {
    count += 1;
    value.textContent = count.toString();
  });

  // ── 비디오 데모 영역 ─────────────────────────────────────────────────────
  // sampleVideoSrc는 webpack이 'assets/media/sample.[hash].mp4' 로 치환한 URL 문자열입니다.
  // 실제 프로젝트에서는 이 stub 파일을 실제 영상 파일로 교체하세요.
  const videoSection = document.createElement('div');
  videoSection.className = 'video-demo';

  const videoLabel = document.createElement('p');
  videoLabel.textContent = '비디오 asset 로드 예시 (webpack asset/resource)';

  const video = document.createElement('video');
  video.className = 'demo-video';
  video.src = sampleVideoSrc;
  video.muted = true;
  video.loop = true;
  video.controls = true;

  videoSection.append(videoLabel, video);

  // ── Mock API 데모 영역 ────────────────────────────────────────────────────
  // USE_MOCK=true(pnpm serve:mock)로 서버를 실행했을 때만 실제 데이터를 반환합니다.
  // 일반 serve:dev 에서는 /api/users 가 404를 반환하므로 에러 메시지가 표시됩니다.
  const apiSection = document.createElement('div');
  apiSection.className = 'api-demo';

  const apiHeading = document.createElement('p');
  apiHeading.textContent = 'Mock API 예시 — GET /api/users';

  const userList = document.createElement('ul');
  userList.className = 'user-list';
  userList.textContent = '불러오는 중…';

  const addForm = document.createElement('form');
  addForm.className = 'add-user-form';
  addForm.innerHTML = `
    <input name="name" placeholder="이름" required />
    <input name="email" type="email" placeholder="이메일" required />
    <button type="submit">추가 (POST)</button>
  `;

  apiSection.append(apiHeading, userList, addForm);

  // 사용자 목록 렌더링 헬퍼
  function renderUsers(users: Array<{ id: number; name: string; email: string; role: string }>) {
    userList.innerHTML = '';
    if (users.length === 0) {
      userList.textContent = '(사용자 없음)';
      return;
    }
    users.forEach((u) => {
      const li = document.createElement('li');
      li.dataset.id = String(u.id);
      li.innerHTML = `<span>${u.name} &lt;${u.email}&gt; [${u.role}]</span>`;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = '삭제';
      delBtn.addEventListener('click', async () => {
        await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
        loadUsers();
      });

      li.append(delBtn);
      userList.append(li);
    });
  }

  // GET /api/users 호출
  async function loadUsers() {
    userList.textContent = '불러오는 중…';
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      renderUsers(await res.json());
    } catch (err) {
      userList.textContent = `오류: ${err instanceof Error ? err.message : err} — pnpm serve:mock 으로 실행하세요.`;
    }
  }

  // POST /api/users 호출
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(addForm);
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fd.get('name'), email: fd.get('email') }),
    });
    addForm.reset();
    loadUsers();
  });

  loadUsers();

  app.append(heading, description, value, incrementBtn, envInfo, videoSection, apiSection);
  return app;
}

/**
 * 지정된 루트 엘리먼트에 카운터 UI를 렌더링한다.
 * @param rootId 루트 요소 id
 */
export function renderApp(rootId = DEFAULT_ROOT_ID): void {
  const root = document.getElementById(rootId);
  if (!root) {
    throw new Error(`Root element '${rootId}' not found`);
  }
  const app = createApp();
  root.replaceChildren(app);
}

/**
 * 브라우저 실행 시 자동 부트스트랩.
 * 테스트 환경(Vitest)에서는 실행하지 않는다.
 * @param rootId 루트 요소 id
 */
export function bootstrap(rootId = DEFAULT_ROOT_ID): void {
  const root = document.getElementById(rootId);
  if (!root) {
    // 테스트/SSR 환경에서는 부드럽게 건너뛴다.
    console.warn(`Root element '${rootId}' not found. Skipping render.`);
    return;
  }
  renderApp(rootId);
}

// 테스트 환경 여부 판단
// VITEST가 설정된 경우 자동 렌더를 방지
const isTest = typeof process !== 'undefined' && Boolean(process.env.VITEST);

if (!isTest) {
  bootstrap();
}

if (import.meta.webpackHot) {
  // webpack-dev-server의 Hot Module Replacement: 모듈 교체 시 전체 새로고침 없이 갱신
  import.meta.webpackHot.accept();
}
