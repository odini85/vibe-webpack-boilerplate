# 예시 프로젝트 webpack 설정 해설

## 1) 전체 구조

예시 프로젝트는 설정을 3개 파일로 분리합니다.
아래 파일명/스크립트는 하나의 샘플이며, 블로그 독자는 본인 구조에 맞게 치환해 읽으면 됩니다.

```
webpack.common.js  ←  공통 설정 (entry, output, loaders, plugins)
      ↑                     ↑
webpack.dev.js          webpack.prod.js
(merge로 병합)           (merge로 병합)
```

### 소스 디렉터리 구조

```
src/
├── assets/
│   ├── fonts/
│   │   ├── Inter-Regular.woff2   ← 웹폰트 (WOFF2, 최신 브라우저)
│   │   └── Inter-Regular.woff    ← 웹폰트 (WOFF, 구형 브라우저 fallback)
│   ├── videos/
│   │   └── sample.mp4            ← 비디오 (stub — 실제 영상으로 교체 가능)
│   └── logo.png
├── styles/
│   └── main.scss                 ← @font-face 선언 포함
├── types/
│   └── assets.d.ts               ← 폰트·비디오·이미지 TypeScript 타입 선언
├── index.ts                      ← 엔트리: 비디오 import + 카운터 UI
└── index.html
```

### 빌드 후 dist 구조

```
dist/
├── assets/
│   ├── css/   main.[contenthash].css
│   ├── js/    main.[contenthash].js
│   ├── fonts/ Inter-Regular[hash].woff2
│   │          Inter-Regular[hash].woff
│   └── media/ sample[hash].mp4
└── index.html
```

| 파일 | 역할 |
|------|------|
| `webpack.common.js` | 개발/프로덕션 모두 공통으로 사용하는 설정 |
| `webpack.dev.js` | HMR 개발 서버, 빠른 소스맵, CSS DOM 주입 |
| `webpack.prod.js` | JS 압축, CSS 파일 분리, contenthash 파일명 |

### webpack-merge 란?

`webpack-merge` 패키지의 `merge()` 함수는 두 설정 객체를 **스마트하게 합칩니다**.

일반 스프레드(`{...a, ...b}`)와의 차이:
- 스프레드: `rules`, `plugins` 같은 **배열이 교체**됩니다.
- `merge()`: 배열은 **이어 붙이고**, 스칼라는 덮어쓰고, 객체는 재귀 병합합니다.

```js
// 스프레드 — common의 rules가 사라짐 (잘못된 방법)
const bad = { ...common, module: { rules: [devRule] } };

// merge — common의 rules + devRule 이 모두 포함됨 (올바른 방법)
const good = merge(common, { module: { rules: [devRule] } });
```

---

## 2) webpack.common.js

### 환경 변수 로드 — 3단계 병합 전략

```js
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'dev';

const baseEnv    = loadEnv({ path: '.env' }).parsed ?? {};           // 1단계
const profileEnv = loadEnv({ path: `.env.${appEnv}` }).parsed ?? {}; // 2단계
const mergedEnv  = { ...baseEnv, ...profileEnv, ...process.env, APP_ENV: ... }; // 3단계
```

우선순위 (오른쪽이 이깁니다):

```
.env  →  .env.<APP_ENV>  →  process.env(CLI/쉘 직접 주입)
```

예시:
- `.env`에 `APP_NAME=기본앱`, `.env.qa`에 `APP_NAME=QA앱` 이 있을 때
- `pnpm build:qa`를 실행하면 `APP_NAME`은 `QA앱`이 됩니다.
- `APP_NAME=강제앱 pnpm build:qa`로 실행하면 `강제앱`이 됩니다.

### 클라이언트 안전 필터링

```js
// 브라우저 번들에 노출 가능한 키만 선별
const clientEnvRaw = Object.fromEntries(
  Object.entries(mergedEnv).filter(
    ([key]) => key.startsWith('APP_') || key === 'NODE_ENV' || key === 'APP_ENV',
  ),
);
```

`DB_PASSWORD`, `SECRET_KEY` 같은 서버 전용 값이 클라이언트 번들에 포함되지 않도록 `APP_` 접두사를 가진 키만 허용합니다.

### DefinePlugin 치환 맵 구성

```js
// process.env.KEY 형태 참조를 정적 리터럴로 치환하는 맵
const defineEnv = Object.fromEntries(
  Object.entries(clientEnvRaw).map(([key, value]) => [
    `process.env.${key}`,
    JSON.stringify(value),
  ]),
);
```

소스 코드에서 `process.env.APP_ENV`라고 쓰면, 빌드 결과물에서는 `"production"` 같은 리터럴로 교체됩니다.

### entry

```js
entry: './src/index.ts'
```

의존성 그래프 탐색이 시작되는 파일입니다.

### output

```js
output: {
  filename: 'assets/js/[name].[contenthash].js',
  path: path.resolve(__dirname, 'dist'),
  assetModuleFilename: 'assets/media/[name][hash][ext][query]',
}
```

| 필드 | 값 | 이유 |
|------|----|------|
| `filename` | `[name].[contenthash].js` | 내용 변경 시에만 해시가 바뀌어 캐시 효율적 |
| `path` | `dist/` 절대 경로 | webpack은 절대 경로를 요구합니다 |
| `assetModuleFilename` | `assets/media/...` | 이미지/폰트를 한 폴더에 모아 관리 |

### resolve

```js
resolve: { extensions: ['.ts', '.tsx', '.js'] }
```

`import './utils'`처럼 확장자를 생략하면 왼쪽부터 순서대로 탐색합니다.
`.ts`가 `.js`보다 앞에 있어야 TypeScript 파일이 우선 선택됩니다.

### module.rules

```js
// 규칙 1: TypeScript
{ test: /\.tsx?$/, exclude: /node_modules/, use: 'ts-loader' }

// 규칙 2: 이미지
{ test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' }

// 규칙 3: 웹폰트 — assets/fonts/ 에 분리 출력
{
  test: /\.(woff2?|ttf|otf|eot)$/i,
  type: 'asset/resource',
  generator: { filename: 'assets/fonts/[name][hash][ext]' },
}

// 규칙 4: 비디오 — assets/media/ 에 출력
{
  test: /\.(mp4|webm|ogg)$/i,
  type: 'asset/resource',
  generator: { filename: 'assets/media/[name][hash][ext][query]' },
}
```

- `ts-loader`: TypeScript → JavaScript 트랜스파일. `tsconfig.json`을 함께 읽습니다.
- 이미지 `asset/resource`: 별도 파일 출력, `import` 반환값은 URL 문자열.
- 웹폰트 `asset/resource`: `generator.filename`으로 `assets/fonts/`에 분리 출력. CSS/SCSS `@font-face`에서 참조합니다.
- 비디오 `asset/resource`: `mp4`/`webm`/`ogg`를 `assets/media/`에 출력. TypeScript `import` 시 URL 문자열로 반환되어 `<video src>`에 바로 사용 가능합니다.

### plugins

```js
new HtmlWebpackPlugin({ template: './src/index.html' })
new DefinePlugin({ 'process.env': JSON.stringify(clientEnvRaw), ...defineEnv })
```

- `HtmlWebpackPlugin`: 템플릿 HTML에 빌드된 JS/CSS 경로를 자동 주입한 최종 `dist/index.html`을 생성합니다.
- `DefinePlugin`: 빌드 시점에 `process.env.*` 참조를 정적 리터럴로 치환합니다. `process.env` 객체 전체 참조(`clientEnvRaw`)와 개별 키 참조(`...defineEnv`) 두 가지를 모두 등록합니다.

---

## 3) webpack.dev.js (개발)

```js
export default merge(common, { ... })
```

### mode / devtool

```js
mode: 'development',
devtool: 'eval-source-map',
```

| 설정 | 이유 |
|------|------|
| `mode: 'development'` | 코드 압축/최적화 없이 빠른 빌드 우선 |
| `devtool: 'eval-source-map'` | 별도 파일 없이 eval 안에 소스맵 포함 → 리빌드 빠름 + 원본 위치 정확 |

### output

```js
output: {
  filename: 'assets/js/[name].js', // contenthash 없이 고정 이름
  clean: true,
}
```

개발 중 파일명이 계속 바뀌면 디버깅이 불편하므로 해시를 제거합니다.
`clean: true`로 매 빌드 전 `dist/`를 비워 이전 산출물이 남지 않게 합니다.

### stats / infrastructureLogging

```js
stats: 'minimal',
infrastructureLogging: { level: 'info' },
```

터미널 출력을 최소화해 에러/경고를 놓치지 않도록 합니다.
`stats: 'minimal'`은 에러·경고와 빌드 완료 메시지만 출력합니다.

### devServer

```js
devServer: {
  static: path.join(process.cwd(), 'dist'),
  hot: true,
  port: 5173,
  open: false,
  client: { overlay: true, logging: 'none', progress: true },
  devMiddleware: { stats: 'minimal' },
}
```

| 필드 | 값 | 이유 |
|------|----|------|
| `hot` | `true` | HMR — 변경 모듈만 교체해 입력값·스크롤 유지 |
| `port` | `5173` | Vite 기본 포트와 같아 팀 내 혼선 최소화 |
| `open` | `false` | CI/서버 환경에서 불필요한 브라우저 실행 방지 |
| `client.overlay` | `true` | 빌드 에러를 브라우저 화면에서 즉시 확인 |
| `client.logging` | `'none'` | HMR 내부 로그를 콘솔에서 숨겨 노이즈 제거 |
| `client.progress` | `true` | 브라우저 탭 타이틀로 빌드 진행률 확인 |

### plugins

```js
new webpack.ProgressPlugin({ percentBy: 'entries' })
```

터미널에 0–100% 빌드 진행률을 실시간으로 출력합니다.
`percentBy: 'entries'`는 엔트리 단위로 진행률을 계산합니다.

### module.rules (스타일)

```js
{ test: /\.s?css$/i, use: ['style-loader', 'css-loader', 'sass-loader'] }
```

실행 순서: `sass-loader → css-loader → style-loader`

`style-loader`가 CSS를 `<style>` 태그로 DOM에 동적 삽입합니다.
HMR과 궁합이 좋아 CSS 변경이 즉시 화면에 반영됩니다.

---

## 4) webpack.prod.js (배포)

```js
export default merge(common, { ... })
```

### mode / devtool

```js
mode: 'production',
devtool: 'source-map',
```

| 설정 | 이유 |
|------|------|
| `mode: 'production'` | Terser JS 압축 + 트리쉐이킹 + 스코프 호이스팅 자동 활성화 |
| `devtool: 'source-map'` | 별도 `.map` 파일 생성 → 운영 에러 추적에 사용 |

### output.clean

```js
output: { clean: true }
```

빌드 전 `dist/` 폴더를 비워 이전 빌드 산출물이 잔존하지 않게 합니다.

### module.rules (스타일)

```js
{ test: /\.s?css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] }
```

실행 순서: `sass-loader → css-loader → MiniCssExtractPlugin.loader`

`style-loader` 대신 `MiniCssExtractPlugin.loader`를 사용합니다.
CSS를 JS 번들에서 분리해 별도 `.css` 파일로 추출하면 JS와 CSS가 병렬로 다운로드되어 초기 렌더링이 빨라집니다.

### plugins

```js
new MiniCssExtractPlugin({
  filename: 'assets/css/[name].[contenthash].css',
})
```

`MiniCssExtractPlugin.loader`(로더)와 이 플러그인 인스턴스는 세트입니다.
로더가 추출할 내용을 수집하고, 플러그인이 파일로 기록합니다.
`[contenthash]`로 파일 내용이 변경될 때만 파일명 해시가 바뀌어 캐시를 효율적으로 관리합니다.

---

## 5) 환경별 실행 흐름 요약

```
pnpm serve:dev
  └─ APP_ENV=dev webpack serve --config webpack.dev.js
       ├─ .env 로드
       ├─ .env.dev 로드 (override)
       └─ process.env 가 최우선으로 덮어씀

pnpm build:qa
  └─ APP_ENV=qa webpack --config webpack.prod.js
       ├─ .env 로드
       ├─ .env.qa 로드 (override)
       └─ 클라이언트 안전 키만 DefinePlugin으로 번들에 주입
```
