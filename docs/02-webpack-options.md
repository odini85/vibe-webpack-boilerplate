# Webpack 주요 옵션 설명

## 먼저: webpack 설정 객체를 읽는 방법

webpack 설정은 결국 "하나의 큰 객체"입니다.

```js
export default {
  mode: 'development',
  entry: './src/index.ts',
  output: { ... },
  module: { rules: [ ... ] },
  plugins: [ ... ],
};
```

---

## mode

무엇인가:

- webpack의 기본 동작 성향을 결정하는 스위치입니다.

왜 필요한가:

- 개발 중에는 속도가 중요하고, 배포 시에는 파일 크기 최적화/성능이 중요하기 때문입니다.

값:

| 값              | 동작                                                      |
| --------------- | --------------------------------------------------------- |
| `'development'` | 빠른 빌드. 코드 압축 없음. 디버그 정보 포함               |
| `'production'`  | Terser로 JS 압축, 트리쉐이킹, 스코프 호이스팅 자동 활성화 |
| `'none'`        | webpack 기본 최적화만 적용. 커스텀 제어가 필요할 때 사용  |

예시 설정:

```js
// webpack.dev.js
export default {
  mode: 'development',
  // 코드 압축 없음, 빠른 빌드 우선
};

// webpack.prod.js
export default {
  mode: 'production',
  // Terser JS 압축 + 트리쉐이킹 + 스코프 호이스팅 자동 활성화
};
```

---

## entry

무엇인가:

- 번들링 시작 파일입니다.
- "여기서부터 `import`를 따라가며 필요한 모든 파일을 모아라"라는 뜻입니다.

왜 필요한가:

- 시작점을 모르면 webpack이 어떤 파일들을 묶어야 하는지 알 수 없습니다.

값 형태:

| 형태   | 예시                                               | 설명                                   |
| ------ | -------------------------------------------------- | -------------------------------------- |
| 문자열 | `'./src/index.ts'`                                 | 단일 엔트리. 청크 이름 자동으로 `main` |
| 객체   | `{ app: './src/app.ts', admin: './src/admin.ts' }` | 멀티 엔트리. 각각 별도 청크 생성       |
| 배열   | `['./src/polyfill.ts', './src/index.ts']`          | 여러 파일을 하나의 청크로 합산         |

예시 설정:

```js
// 문자열 — 단일 엔트리 (청크 이름 자동으로 'main')
entry: './src/index.ts'

// 객체 — 멀티 엔트리 (페이지별 분리 번들)
entry: {
  app: './src/app.ts',
  admin: './src/admin.ts',
}

// 배열 — 여러 파일을 하나의 청크로 합산
entry: ['./src/polyfill.ts', './src/index.ts']
```

바꾸면 영향:

- 엔트리를 다른 파일로 바꾸면 애플리케이션 시작 코드가 달라집니다.
- 멀티 엔트리(객체)로 가면 페이지별 분리 번들이 가능합니다.

---

## output

무엇인가:

- 번들 결과물을 어디에, 어떤 이름으로 쓸지 정의합니다.

왜 필요한가:

- 배포 파일 관리(캐시/경로/정리)를 일관되게 하기 위해 필요합니다.

주요 하위 필드:

| 필드                  | 설명                                                 |
| --------------------- | ---------------------------------------------------- |
| `path`                | 결과물 디렉터리 절대 경로 (`path.resolve` 사용 권장) |
| `filename`            | JS 출력 파일명 패턴                                  |
| `assetModuleFilename` | `type: 'asset/resource'` 로 처리된 파일의 출력 패턴  |
| `clean`               | `true`이면 빌드 전 출력 폴더를 비웁니다              |

파일명 패턴 토큰:

| 토큰            | 의미                                                |
| --------------- | --------------------------------------------------- |
| `[name]`        | 엔트리 이름 (기본값: `main`)                        |
| `[contenthash]` | 파일 **내용** 기반 해시. 내용이 바뀔 때만 해시 변경 |
| `[hash]`        | 빌드 전체 해시. 파일 하나라도 바뀌면 모두 변경      |
| `[ext]`         | 원본 확장자 (`.png`, `.svg` 등)                     |
| `[query]`       | URL 쿼리 문자열                                     |

예시 설정:

```js
// webpack.common.js — 공통 output
output: {
  path: path.resolve(__dirname, 'dist'),           // 결과물 폴더 (절대 경로 필수)
  filename: 'assets/js/[name].[contenthash].js',   // 내용 변경 시에만 해시 갱신
  assetModuleFilename: 'assets/media/[name][hash][ext][query]', // 이미지·폰트 경로
},

// webpack.dev.js — 개발 output (해시 제거로 디버깅 편의)
output: {
  filename: 'assets/js/[name].js',
  clean: true,   // 빌드 전 dist/ 초기화
},

// webpack.prod.js — 배포 output
output: {
  clean: true,   // 빌드 전 dist/ 초기화
},
```

자주 헷갈림:

- `[contenthash]`는 파일 내용이 바뀔 때만 이름이 바뀝니다.
- 브라우저 캐시를 효율적으로 무효화하는 데 매우 중요합니다.

---

## resolve

무엇인가:

- `import` 경로를 어떻게 해석할지 규칙을 정합니다.

왜 필요한가:

- `import './foo'`처럼 확장자를 생략했을 때 어떤 파일을 찾을지 결정해야 합니다.

주요 하위 필드:

| 필드         | 설명                                                  |
| ------------ | ----------------------------------------------------- |
| `extensions` | 생략 가능한 확장자 우선순위 목록 (왼쪽 우선)          |
| `alias`      | 경로 별칭 (예: `'@': path.resolve(__dirname, 'src')`) |

예시 설정:

```js
resolve: {
  extensions: ['.ts', '.tsx', '.js'],
  // import './utils' 입력 시 탐색 순서:
  //   1. ./utils.ts  → 있으면 사용
  //   2. ./utils.tsx → 없으면 다음
  //   3. ./utils.js  → 없으면 오류

  // alias 예시 — '@'로 src/ 를 짧게 참조
  alias: {
    '@': path.resolve(__dirname, 'src'),
    // import '@/components/Button' === import './src/components/Button'
  },
},
```

자주 헷갈림:

- 우선순위가 앞에 있는 확장자가 먼저 매칭됩니다.
- `'.ts'`가 `'.js'`보다 앞에 있어야 같은 이름의 JS 파일보다 TS 파일이 먼저 선택됩니다.

---

## module

무엇인가:

- "파일 타입별 변환 규칙"을 모아두는 섹션입니다.

왜 필요한가:

- 브라우저는 TS/SCSS를 바로 실행할 수 없어서 변환 과정이 필요합니다.

### module.rules

규칙 1개는 보통 아래처럼 읽습니다.

```js
{
  test: /\.tsx?$/,       // 어떤 파일에 적용할지 (정규식)
  exclude: /node_modules/,  // 어떤 경로는 제외할지
  use: 'ts-loader',     // 어떤 로더로 변환할지
}
```

rule 객체의 주요 필드:

| 필드      | 타입            | 설명                                                         |
| --------- | --------------- | ------------------------------------------------------------ |
| `test`    | RegExp          | 이 정규식에 매칭되는 파일에 로더를 적용                      |
| `exclude` | RegExp          | 매칭 대상에서 제외할 경로                                    |
| `include` | RegExp          | 이 경로만 포함 (exclude와 반대)                              |
| `use`     | string \| array | 적용할 로더. 배열이면 **오른쪽→왼쪽** 순서로 실행            |
| `type`    | string          | Asset Module 방식으로 처리. 별도 로더 없이 webpack 내장 처리 |

### type — Asset Module 타입

로더 없이 webpack 내장 기능으로 파일을 처리하는 방식입니다.

| 값                 | 동작                                                      | 적합한 파일      |
| ------------------ | --------------------------------------------------------- | ---------------- |
| `'asset/resource'` | 별도 파일로 출력. import 값은 URL 문자열                  | 이미지, 폰트     |
| `'asset/inline'`   | Base64 Data URL로 인라인 삽입                             | 아주 작은 아이콘 |
| `'asset/source'`   | 파일 내용을 문자열로 반환                                 | 텍스트, SVG 소스 |
| `'asset'`          | 크기에 따라 `resource`/`inline` 자동 선택 (기본 8KB 기준) | 범용             |

예시 규칙:

1. **TS/TSX 규칙** (`webpack.common.js`)

```js
{ test: /\.tsx?$/, exclude: /node_modules/, use: 'ts-loader' }
```

2. **이미지 규칙** (`webpack.common.js`)

```js
{ test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' }
```

3. **웹폰트 규칙** (`webpack.common.js`)

```js
{
  test: /\.(woff2?|ttf|otf|eot)$/i,
  type: 'asset/resource',
  generator: {
    filename: 'assets/fonts/[name][hash][ext]',
    // generator.filename 이 assetModuleFilename 보다 우선 적용됨
  },
}
```

> `generator.filename`을 지정하면 공통 설정의 `assetModuleFilename`보다 우선 적용됩니다.
> 폰트를 이미지와 다른 폴더(`assets/fonts/`)에 분리 출력하는 데 사용합니다.

4. **비디오 규칙** (`webpack.common.js`)

```js
{
  test: /\.(mp4|webm|ogg)$/i,
  type: 'asset/resource',
  generator: {
    filename: 'assets/media/[name][hash][ext][query]',
  },
}
```

5. **스타일 규칙 — 개발** (`webpack.dev.js`)

```js
{ test: /\.s?css$/i, use: ['style-loader', 'css-loader', 'sass-loader'] }
// 실행 순서: sass-loader → css-loader → style-loader
```

6. **스타일 규칙 — 배포** (`webpack.prod.js`)

```js
{ test: /\.s?css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] }
// 실행 순서: sass-loader → css-loader → MiniCssExtractPlugin.loader
```

---

## plugins

무엇인가:

- 로더가 "파일 단위 변환"이라면, 플러그인은 "빌드 전체 과정"에 기능을 추가합니다.

왜 필요한가:

- HTML 자동 생성, env 치환, CSS 추출처럼 빌드 전반에 걸친 기능은 로더만으로 처리하기 어렵습니다.

예시 플러그인:

### HtmlWebpackPlugin

**문제**: 빌드마다 JS 파일명 해시가 바뀌어 HTML에서 수동으로 경로를 관리해야 합니다.
**해결**: 템플릿 HTML에 빌드된 JS/CSS 경로를 `<script>`/`<link>` 태그로 자동 삽입합니다.

```js
new HtmlWebpackPlugin({
  template: './src/index.html',
});
```

### DefinePlugin

**문제**: 브라우저에는 Node.js의 `process` 객체가 없어 `process.env.XXX` 참조가 런타임 오류를 냅니다.
**해결**: 빌드 시점에 `process.env.XXX` 식별자를 실제 문자열 리터럴로 교체합니다.

```js
new DefinePlugin({
  'process.env': JSON.stringify(clientEnvRaw), // 객체 전체 참조용
  'process.env.APP_ENV': JSON.stringify('production'), // 개별 키 참조용
});
```

> 주입된 값은 JS 번들에 평문으로 포함됩니다. 비밀번호·토큰은 절대 넣지 마세요.

### MiniCssExtractPlugin (prod)

CSS를 JS 번들에서 분리해 별도 `.css` 파일로 추출합니다.
`MiniCssExtractPlugin.loader`(로더)와 이 플러그인 인스턴스가 **세트**로 동작합니다.

```js
new MiniCssExtractPlugin({
  filename: 'assets/css/[name].[contenthash].css',
});
```

### ProgressPlugin (dev)

webpack 내장 플러그인. 터미널에 0–100% 빌드 진행률을 실시간으로 출력합니다.

```js
new webpack.ProgressPlugin({ percentBy: 'entries' });
```

---

## devtool

무엇인가:

- 소스맵 전략(디버깅 정보 생성 방식)입니다.
- 소스맵은 번들된 코드를 원본 파일 기준으로 디버깅할 수 있게 해주는 매핑 파일입니다.

왜 필요한가:

- 브라우저에서는 번들된 코드가 실행되므로, 원본 TS 파일 기준으로 디버깅하려면 매핑 정보가 필요합니다.

핵심 차이(실제로 무엇이 달라지는가):

| 값 | 빌드 결과물 | DevTools에서 보이는 소스 | 디버깅 정확도 | 속도 | 운영 노출 위험 |
| --- | --- | --- | --- | --- | --- |
| `'eval-source-map'` | JS 번들 내부 `eval`에 인라인 소스맵 | 원본 파일에 가깝게 표시 | 높음(줄/컬럼) | 빠름 | 개발용(운영 부적합) |
| `'eval-cheap-source-map'` | JS 번들 내부 `eval` 소스맵 | 원본 파일 표시 | 중간(줄 위주, 컬럼 낮음) | 매우 빠름 | 개발용(운영 부적합) |
| `'source-map'` | `bundle.js` + 별도 `bundle.js.map` 파일 | 원본 파일 정확히 표시 | 높음(줄/컬럼) | 느림 | `.map` 공개 시 소스 구조 노출 가능 |
| `'hidden-source-map'` | `bundle.js` + `bundle.js.map` 생성(참조 주석 미삽입) | 브라우저에서 자동 참조 어려움 | 높음(에러 수집 도구 연동 시) | 느림 | `source-map`보다 공개 위험 낮음 |
| `false` | 소스맵 파일/정보 생성 안 함 | 번들 코드만 보임 | 낮음 | 가장 빠름 | 소스맵 노출 위험 없음 |

빠르게 결정하는 기준:

- 로컬 개발: `eval-source-map`  
  이유: 변경 반영이 빠르고, 원본 TS 기준으로 디버깅하기 편함
- 운영 디버깅이 필요: `source-map` 또는 `hidden-source-map`  
  이유: 스택트레이스를 원본 코드로 복원 가능
- 운영에서 소스 노출을 최소화: `hidden-source-map` 또는 `false`  
  이유: 브라우저가 `.map`을 쉽게 참조하지 못하게 하거나, 아예 생성하지 않음

예시 설정:

```js
// webpack.dev.js — 빠른 재빌드 + 정확한 원본 위치
devtool: 'eval-source-map',
// eval() 안에 소스맵 포함 → 별도 파일 없음, 리빌드 빠름

// webpack.prod.js — 별도 .map 파일로 운영 에러 추적
devtool: 'source-map',
// bundle.js.map 파일 생성 → 브라우저 DevTools에서 원본 코드 확인 가능
```

실무 팁:

- 운영 서버에서 `.map` 파일 접근을 제한하거나, `hidden-source-map`으로 브라우저 참조를 차단하세요.

---

## devServer

무엇인가:

- 개발 중 사용하는 로컬 서버 설정입니다.
- `webpack-dev-server` 패키지가 실제 서버를 제공합니다.

왜 필요한가:

- 파일 변경 시 자동 재빌드/HMR로 개발 효율이 크게 올라갑니다.
- 빌드 결과를 메모리에서 바로 제공해 디스크 I/O 없이 빠른 응답이 가능합니다.

예시 설정 주요 값:

| 필드     | 값          | 설명                                 |
| -------- | ----------- | ------------------------------------ |
| `static` | `dist` 경로 | 정적 파일 제공 디렉터리              |
| `hot`    | `true`      | HMR 활성화                           |
| `port`   | `5173`      | 수신 포트                            |
| `open`   | `false`     | 서버 시작 시 브라우저 자동 실행 여부 |

### devServer.client — 브라우저 측 동작

| 필드       | 값       | 설명                                          |
| ---------- | -------- | --------------------------------------------- |
| `overlay`  | `true`   | 컴파일 에러를 브라우저 화면에 오버레이로 표시 |
| `logging`  | `'none'` | 브라우저 콘솔의 HMR 관련 로그 출력 수준       |
| `progress` | `true`   | 브라우저 탭 타이틀에 컴파일 진행률(%) 표시    |

`logging` 값 종류: `'none'` | `'error'` | `'warn'` | `'info'` | `'log'` | `'verbose'`

### devServer.devMiddleware — 미들웨어 통계

| 필드    | 값          | 설명                              |
| ------- | ----------- | --------------------------------- |
| `stats` | `'minimal'` | 미들웨어 단계 번들 통계 출력 수준 |

전체 예시 설정:

```js
// webpack.dev.js
devServer: {
  static: path.join(process.cwd(), 'dist'), // 정적 파일 제공 경로
  hot: true,                                // HMR 활성화 — 변경 모듈만 교체
  port: 5173,                               // http://localhost:5173
  open: false,                              // CI 환경에서 브라우저 자동 실행 방지
  client: {
    overlay: true,     // 컴파일 에러를 브라우저 화면 위에 표시
    logging: 'none',   // HMR 내부 로그를 콘솔에서 숨김
    progress: true,    // 탭 타이틀에 빌드 진행률(%) 표시
  },
  devMiddleware: {
    stats: 'minimal',  // 에러·경고·빌드 완료 메시지만 터미널에 출력
  },
},
```

---

## stats / infrastructureLogging

무엇인가:

- 빌드 중 터미널에 출력되는 로그 양과 종류를 제어합니다.
- `stats`: webpack 번들링 결과 통계
- `infrastructureLogging`: 로더·플러그인 내부 로그

왜 필요한가:

- 로그가 너무 많으면 중요한 오류를 놓치기 쉽습니다.

`stats` 값 종류:

| 값              | 출력 내용                      |
| --------------- | ------------------------------ |
| `'none'`        | 아무것도 출력 안 함            |
| `'errors-only'` | 에러만                         |
| `'minimal'`     | 에러/경고 + 빌드 완료 메시지만 |
| `'normal'`      | 기본 정보 (기본값)             |
| `'verbose'`     | 모든 정보                      |

`infrastructureLogging.level` 값 종류:

| 값          | 출력 수준                        |
| ----------- | -------------------------------- |
| `'none'`    | 출력 안 함                       |
| `'error'`   | 에러만                           |
| `'warn'`    | 경고 + 에러                      |
| `'info'`    | 정보 + 경고 + 에러 (예시 설정) |
| `'verbose'` | 디버그 포함 모든 로그            |

예시 설정:

```js
// webpack.dev.js
stats: 'minimal',                          // 에러·경고·완료 메시지만 터미널 출력
infrastructureLogging: { level: 'info' },  // 로더·플러그인 정보 로그 포함
```

---

## env 관련 필드와 보안 주의

예시 설정에서 env는 `DefinePlugin`으로 치환됩니다.
즉, 허용된 키는 최종 JS 결과물 안에 포함될 수 있습니다.

기억할 점:

- `APP_*`, `APP_ENV`, `NODE_ENV`는 브라우저 노출 가능
- 비밀번호/토큰/시크릿은 절대 `APP_`로 넣지 않기
- 우선순위: `CLI > .env.<APP_ENV> > .env`

webpack.common.js 내부 env 처리 흐름:

```js
// 1단계: 기본 .env 로드
const baseEnv = loadEnv({ path: '.env' }).parsed ?? {};

// 2단계: 환경별 파일 로드 (.env.dev / .env.qa / .env.live)
const profileEnv = loadEnv({ path: `.env.${appEnv}` }).parsed ?? {};

// 3단계: CLI/쉘 주입값이 최우선으로 덮어씀
const mergedEnv = { ...baseEnv, ...profileEnv, ...process.env };

// 브라우저에 안전한 키만 필터링
const clientEnvRaw = Object.fromEntries(
  Object.entries(mergedEnv).filter(
    ([key]) => key.startsWith('APP_') || key === 'NODE_ENV' || key === 'APP_ENV',
  ),
);

// process.env.XXX → "리터럴값" 으로 빌드 시 치환
new DefinePlugin({
  'process.env': JSON.stringify(clientEnvRaw),         // 객체 전체 참조
  'process.env.APP_ENV': JSON.stringify('production'), // 개별 키 참조
})
```

CLI에서 직접 주입하는 예시:

```bash
# Mac / Linux
APP_NAME="My App" APP_API_BASE_URL="https://qa-api.example.com" pnpm build:qa

# Windows PowerShell
$env:APP_NAME='My App'; $env:APP_API_BASE_URL='https://qa-api.example.com'; pnpm build:qa
```

---

## webpack-merge

무엇인가:

- 여러 webpack 설정 객체를 하나로 합치는 유틸리티입니다(`webpack-merge` 패키지).

왜 필요한가:

- 개발/프로덕션 설정에서 공통 부분을 중복 없이 재사용하기 위해서입니다.
- 일반 `Object.assign`이나 스프레드 `{...a, ...b}`는 배열(`rules`, `plugins`)을 교체해 버리지만, `merge()`는 배열을 이어 붙입니다.

동작 방식:

```js
// webpack.dev.js
export default merge(common, {
  mode: 'development',
  module: {
    rules: [{ test: /\.s?css$/, use: ['style-loader', 'css-loader', 'sass-loader'] }],
  },
});

// 결과: common의 rules + dev의 rules 가 하나의 배열로 합쳐짐
```

| 병합 대상                  | 동작               |
| -------------------------- | ------------------ |
| 배열 (`rules`, `plugins`)  | 이어 붙임 (concat) |
| 객체 (`output`, `resolve`) | 재귀적으로 병합    |
| 스칼라 (`mode`, `devtool`) | 후자가 덮어씀      |

---

## optimization

무엇인가:

- 번들 결과물의 크기·캐시 효율·청크 분리를 제어하는 설정 그룹입니다.
- 가장 자주 쓰이는 하위 옵션은 `splitChunks`(청크 분리)와 `runtimeChunk`(런타임 분리)입니다.

왜 필요한가:

- webpack 기본 설정은 모든 코드를 하나의 JS 파일로 번들합니다.
- 앱이 커질수록 초기 로딩 파일이 수 MB에 달하고, 코드 한 줄 수정만으로 React·lodash 같은 라이브러리 캐시까지 무효화됩니다.
- `optimization`으로 라이브러리를 별도 파일로 분리하면 캐시 수명이 늘어나고 사용자가 내려받는 변경 파일이 최소화됩니다.

코드 스플리팅 전/후 비교:

```
[분리 전]
dist/assets/js/main.a1b2.js  (3MB — 앱 코드 + React + 라이브러리 전부)

[분리 후]
dist/assets/js/runtime.js           (2KB  — 청크 로딩 조율)
dist/assets/js/react-vendor.c3d4.js (150KB — React 계열, 버전 변경 시만 갱신)
dist/assets/js/vendor.e5f6.js       (200KB — 기타 라이브러리)
dist/assets/js/main.a1b2.js         (50KB  — 앱 코드만)
```

---

### optimization.splitChunks

무엇인가:

- 여러 청크에서 공통으로 사용되는 모듈을 자동 감지해 별도 파일로 추출합니다.
- webpack 5 내장 기능으로, 별도 플러그인 설치 없이 설정만으로 동작합니다.

#### chunks — 분리 대상 범위

| 값 | 분리 대상 | 언제 사용 |
| --- | --- | --- |
| `'async'` **(기본값)** | 동적 `import()`로 생성된 청크만 | 동적 import 위주 SPA |
| `'initial'` | 정적 `import`로 생성된 초기 청크만 | 엔트리 분리가 주목적일 때 |
| `'all'` | 정적 + 동적 import 모두 | **대부분의 프로덕션 설정에서 권장** |

> **자주 헷갈림**: 기본값이 `'async'`이므로, React처럼 정적으로 import하는 라이브러리는
> `chunks: 'all'`을 명시하지 않으면 분리되지 않습니다.

#### 주요 하위 옵션

| 옵션 | 기본값 | 역할 |
| ---- | ------ | ---- |
| `chunks` | `'async'` | 분리 범위 |
| `minSize` | `20000` | 이 크기(바이트) 미만은 분리하지 않음 |
| `maxSize` | `0` | 초과 시 추가 분리 시도. 0 = 제한 없음 |
| `minChunks` | `1` | 이 횟수 이상 참조된 모듈만 분리 |
| `maxInitialRequests` | `30` | 초기 로드 시 최대 병렬 요청 수 |
| `priority` | `0` | cacheGroups 간 우선순위. 높을수록 먼저 적용 |
| `reuseExistingChunk` | `true` | 이미 분리된 청크가 있으면 재사용 |

#### cacheGroups — 세밀한 분리 제어

어떤 모듈을 어느 청크로 묶을지 직접 정의합니다.

```js
// webpack.prod.js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // React 계열 — 가장 높은 priority 로 먼저 처리
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router[-\w]*)[\\/]/,
        name: 'react-vendor',
        chunks: 'all',
        priority: 30,   // vendor(20)보다 높아야 react가 vendor에 흡수되지 않음
      },
      // 나머지 node_modules
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        chunks: 'all',
        priority: 20,
      },
      // 앱 코드 중 2곳 이상에서 공유하는 모듈
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 10,
        reuseExistingChunk: true,
      },
    },
  },
},
```

> `priority`가 중요한 이유: React는 `node_modules`에 있으므로 `vendor` 그룹에도 매칭됩니다.
> react 그룹의 priority(30)가 vendor(20)보다 높아야 `react-vendor` 청크로 분리됩니다.

---

### optimization.runtimeChunk

무엇인가:

- webpack 런타임(청크 로딩 조율 코드)을 별도 파일로 분리합니다.

왜 필요한가:

- `runtimeChunk`가 없으면 각 청크가 자체 런타임을 포함합니다.
- 여러 청크 간 모듈 공유 테이블이 따로 유지되어 로딩 순서 보장이 어렵습니다.
- `'single'`로 설정하면 단일 런타임이 모든 청크의 로딩을 조율하고, `HtmlWebpackPlugin`이 올바른 순서로 `<script>` 태그를 자동 삽입합니다.

```js
optimization: {
  runtimeChunk: 'single',  // 모든 엔트리가 하나의 런타임 청크를 공유
  splitChunks: { ... },
},
```

| 설정 | 동작 |
| ---- | ---- |
| 미설정 (기본) | 각 청크에 런타임 포함. 청크 공유 테이블이 분산됨 |
| `'single'` | 단일 runtime.js 생성. 모든 청크 로딩을 하나의 런타임이 관리 |
| `'multiple'` | 엔트리별 런타임 분리. 멀티 엔트리 앱에서 독립적 런타임이 필요할 때 |

---

### React 분리 시 발생하는 오류와 해결 방법

React를 별도 청크로 분리한 후 아래 오류가 발생하는 경우의 원인과 해결책입니다.

```
Uncaught ReferenceError: React is not defined
Uncaught Error: Invalid hook call.
```

#### 원인 1 — `chunks: 'all'` 누락

```js
// ❌ chunks 생략 → 기본값 'async' 적용
//    정적 import된 React는 분리 안 됨 → main 청크와 동적 청크에 React가 각각 존재
react: {
  test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
  name: 'react-vendor',
  // chunks 없음
},

// ✅ 해결: chunks: 'all' 명시
react: {
  test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
  name: 'react-vendor',
  chunks: 'all',
  priority: 30,
},
```

#### 원인 2 — `runtimeChunk` 미설정으로 인한 청크 로딩 순서 문제

```js
// ✅ 해결: runtimeChunk: 'single' 추가
optimization: {
  runtimeChunk: 'single',
  splitChunks: { ... },
},
```

`runtimeChunk: 'single'`을 추가하면 `HtmlWebpackPlugin`이 아래 순서로 `<script>` 태그를 자동 삽입합니다.

```html
<script src="runtime.js"></script>       <!-- 1. 런타임 먼저 -->
<script src="react-vendor.js"></script>  <!-- 2. React -->
<script src="vendor.js"></script>        <!-- 3. 기타 라이브러리 -->
<script src="main.js"></script>          <!-- 4. 앱 코드 마지막 -->
```

#### 원인 3 — React 인스턴스 중복 (Invalid hook call)

UI 라이브러리가 내부에 React를 번들했거나, `node_modules` 경로 구조가 달라 React 인스턴스가 두 개 생기는 경우입니다.

```js
// ✅ 해결: resolve.alias 로 모든 패키지가 동일한 React를 참조하도록 강제
// webpack.common.js
resolve: {
  extensions: ['.ts', '.tsx', '.js'],
  alias: {
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  },
},
```

---

### 프로덕션 설정 예시

```js
// webpack.prod.js
optimization: {
  runtimeChunk: 'single',
  splitChunks: {
    chunks: 'all',
    minSize: 20_000,
    maxInitialRequests: 10,
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router[-\w]*)[\\/]/,
        name: 'react-vendor',
        chunks: 'all',
        priority: 30,
      },
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        chunks: 'all',
        priority: 20,
      },
    },
  },
},
```
