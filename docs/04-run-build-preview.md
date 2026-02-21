# 실행, 빌드, 미리보기 가이드

아래 명령어(`serve:*`, `build:*`)는 예시 스크립트 이름입니다.
실제 프로젝트에서는 스크립트 이름이 다를 수 있으니 동일한 역할의 명령으로 바꿔 적용하세요.

## 1) 사전 준비

- Node.js 18.17 이상
- pnpm 설치

```bash
pnpm install
```

---

## 2) 개발 서버 실행

각 스크립트는 `APP_ENV` 값만 다르고 나머지 동작은 동일합니다.

| 스크립트           | APP_ENV | 로드되는 env 파일    |
| ------------------ | ------- | -------------------- |
| `pnpm serve:dev`   | `dev`   | `.env` → `.env.dev`  |
| `pnpm serve:qa`    | `qa`    | `.env` → `.env.qa`   |
| `pnpm serve:live`  | `live`  | `.env` → `.env.live` |

```bash
pnpm serve:dev
pnpm serve:qa
pnpm serve:live
```

브라우저 접속:

- `http://localhost:5173`

---

## 3) 빌드

| 스크립트          | APP_ENV | 로드되는 env 파일    |
| ----------------- | ------- | -------------------- |
| `pnpm build:dev`  | `dev`   | `.env` → `.env.dev`  |
| `pnpm build:qa`   | `qa`    | `.env` → `.env.qa`   |
| `pnpm build:live` | `live`  | `.env` → `.env.live` |

```bash
pnpm build:dev
pnpm build:qa
pnpm build:live
```

결과물 위치:

- `dist/`

---

## 4) 빌드 결과 미리보기 (정적 서버)

`pnpm preview`는 `dist/` 폴더를 정적 파일 서버로 실행합니다.

webpack 개발 서버가 아닌 별도의 정적 서버(`scripts/serve-dist.mjs`)로 동작합니다.

실제 배포 환경과 동일하게 번들 결과물을 확인할 수 있습니다.

```bash
pnpm preview
```

기본 포트:

- `4173`

한 번에 빌드 + 미리보기 (live 환경 기준):

```bash
pnpm build:preview
```

포트 변경:

```bash
PORT=5000 pnpm preview
```

---

## 5) 코드 품질 및 테스트 스크립트

### 타입 체크

```bash
pnpm typecheck
```

`tsc --noEmit`을 실행합니다. JS 파일을 출력하지 않고 타입 오류만 검사합니다.
빌드 전 타입 안정성을 확인할 때 사용합니다.

### 린트 검사

```bash
pnpm lint        # 오류만 출력
pnpm lint:fix    # 자동 수정 가능한 오류 수정
```

ESLint로 코드 품질과 import 순서를 검사합니다.
`lint:fix`는 자동으로 고칠 수 있는 항목을 수정합니다 (복잡한 로직 오류는 수동 수정 필요).

### 코드 포맷

```bash
pnpm format
```

Prettier로 프로젝트 전체 파일의 코드 스타일을 통일합니다.
들여쓰기, 따옴표, 세미콜론, 줄 길이 등을 `.prettierrc` 기준으로 맞춥니다.

### 테스트

```bash
pnpm test         # 테스트 1회 실행 후 종료 (CI 용도)
pnpm test:watch   # 파일 변경 감지 시 자동 재실행 (개발 중 사용)
```

Vitest로 `src/` 내 `*.test.ts` / `*.spec.ts` 파일을 실행합니다.
jsdom 환경에서 동작해 `document`, `window` 같은 브라우저 API를 사용할 수 있습니다.

---

## 6) 환경변수 주입 예시

CLI에서 직접 넣은 값이 `.env` 파일 값보다 우선합니다.

우선순위:

```
CLI/쉘 직접 주입  >  .env.<APP_ENV>  >  .env
```

**Mac / Linux (bash/zsh)**:

```bash
APP_NAME="My App" APP_API_BASE_URL="https://qa-api.example.com" pnpm build:qa
```

**Windows cmd**:

```cmd
set APP_NAME=My App && set APP_API_BASE_URL=https://qa-api.example.com && pnpm build:qa
```

**Windows PowerShell**:

```powershell
$env:APP_NAME='My App'; $env:APP_API_BASE_URL='https://qa-api.example.com'; pnpm build:qa
```

> `package.json` 스크립트(`serve:*`, `build:*`)는 `cross-env`로 크로스 플랫폼을 보장하지만,
> 위처럼 터미널에서 직접 변수를 주입할 때는 OS에 맞는 문법을 사용해야 합니다.

중요:

- `APP_` 접두어, `APP_ENV`, `NODE_ENV`는 브라우저 번들에 포함될 수 있습니다.
- 비밀번호, 토큰 같은 민감값은 절대 넣지 마세요.

---

## 7) 자주 발생하는 문제

### Q1. `Root element 'root' not found` 경고가 나옵니다.

- `src/index.html`에 `<div id="root"></div>`가 있는지 확인하세요.

### Q2. `dist`가 없다고 나옵니다.

- `pnpm preview`를 실행하기 전에 `pnpm build:live` 또는 `pnpm build:qa`를 먼저 실행하세요.

### Q3. 스타일 변경이 반영되지 않습니다.

- 개발 서버를 재시작하고 브라우저 캐시를 새로고침하세요.
- `src/index.ts`에서 `import './styles/main.scss';`가 유지되어야 합니다.

### Q4. 환경변수 값이 예상과 다릅니다.

- 우선순위는 `CLI > .env.<APP_ENV> > .env` 입니다.
- 실행 커맨드에 `APP_ENV`가 의도대로 들어갔는지 확인하세요.

### Q5. 타입 에러가 있는데 빌드가 성공합니다.

- `ts-loader`는 기본적으로 타입 에러가 있어도 트랜스파일을 완료합니다.
- 빌드 전에 `pnpm typecheck`로 타입 오류를 별도로 확인하세요.
