## 1) webpack이 하는 일

webpack은 여러 파일(TypeScript, CSS/SCSS, 이미지 등)을 읽어서 브라우저가 실행할 수 있는 결과물(JS/CSS/이미지 파일)로 묶어 주는 도구입니다.

쉽게 말해:

- 입력: `src/`에 있는 소스 파일들
- 처리: 규칙(로더/플러그인)에 따라 변환
- 출력: `dist/`에 배포 가능한 파일 생성

---

## 2) 왜 필요한가

브라우저는 TypeScript, SCSS를 그대로 이해하지 못합니다.
webpack은 다음을 대신 수행합니다.

- TypeScript → JavaScript 변환
- SCSS → CSS 변환
- 이미지 파일 경로 정리 및 출력
- 개발 서버/HMR(코드 변경 즉시 반영)
- 프로덕션 빌드 최적화(압축, 캐시 친화 파일명)

---

## 3) 핵심 개념

### Entry(엔트리)

번들링을 시작하는 첫 파일입니다.
webpack은 "여기서부터 `import`를 따라가며 필요한 모든 파일을 수집한다"는 방식으로 동작합니다.

```js
// webpack.common.js
export default {
  entry: './src/index.ts', // 이 파일부터 import 를 재귀 추적
};
```

---

### Dependency Graph(의존성 그래프)

엔트리에서 `import`된 파일들을 재귀적으로 추적해 하나의 거대한 그래프를 만듭니다.
webpack은 이 그래프를 기반으로 실제로 사용되는 파일만 번들에 포함합니다.

---

### Loader(로더)

webpack이 기본적으로 이해하는 것은 `.js`와 `.json`뿐입니다.
다른 형식(TypeScript, SCSS, 이미지 등)을 처리하려면 **로더**가 필요합니다.

로더는 파일을 입력받아 webpack이 이해할 수 있는 형태로 **변환**하는 함수입니다.
`use` 배열에 여러 로더를 나열하면 **오른쪽 → 왼쪽** 순서로 순차 실행됩니다.

```ts
{
  // sass-loader → css-loader → style-loader 순으로 파이프라인 실행
  // style-loader 가 최종 CSS 를 <style> 태그로 DOM 에 주입해 HMR 즉시 반영
  test: /\.s?css$/i,
  use: ['style-loader', 'css-loader', 'sass-loader'],
},
```

#### 일반적으로 사용되는 로더들

> **Asset Module** (webpack 5 내장) — 폰트·이미지·비디오처럼 "그대로 출력"만 하면 되는 파일은
> 별도 로더 없이 `type` 필드만으로 처리합니다. 아래 표를 참고하세요.

---

##### ts-loader

| 항목 | 내용                                                                                         |
| ---- | -------------------------------------------------------------------------------------------- |
| 입력 | `.ts`, `.tsx` 파일                                                                           |
| 출력 | JavaScript 코드                                                                              |
| 역할 | TypeScript 컴파일러(`tsc`)를 webpack 파이프라인에 연결해 TS → JS 트랜스파일을 수행합니다     |
| 주의 | `tsconfig.json` 설정을 함께 읽습니다. `strict`, `target` 등 옵션이 빌드 결과에 영향을 줍니다 |

```js
{
  test: /\.tsx?$/,      // .ts 또는 .tsx 파일에 적용
  exclude: /node_modules/,
  use: 'ts-loader',
}
```

---

##### sass-loader

| 항목   | 내용                                                         |
| ------ | ------------------------------------------------------------ |
| 입력   | `.scss`, `.sass` 파일                                        |
| 출력   | CSS 문자열                                                   |
| 역할   | Sass/SCSS 문법(변수, 중첩, mixin 등)을 순수 CSS로 변환합니다 |
| 의존성 | 실제 컴파일은 별도 설치한 `sass` 패키지가 담당합니다         |
| 위치   | 항상 로더 파이프라인의 가장 오른쪽(먼저 실행)에 위치합니다   |

---

##### css-loader

| 항목 | 내용                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 입력 | CSS 문자열 (sass-loader 결과)                                                                                                  |
| 출력 | webpack 모듈                                                                                                                   |
| 역할 | CSS 안의 `@import`, `url()` 참조를 webpack 의존성으로 해석합니다. 이 단계가 없으면 CSS 내부 참조를 webpack이 추적하지 못합니다 |

---

##### style-loader

| 항목      | 내용                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| 입력      | webpack 모듈화된 CSS                                                                              |
| 출력      | 없음 (부수효과: DOM 조작)                                                                         |
| 역할      | CSS를 `<style>` 태그로 만들어 브라우저 `<head>`에 **런타임에 동적으로 삽입**합니다                |
| 사용 환경 | **개발 전용** — JS가 로드되어야 스타일이 적용되지만, HMR과 궁합이 좋아 CSS 변경이 즉시 반영됩니다 |

```
빌드 후 브라우저 DOM:
<head>
  <style>/* scss 파일 내용이 변환되어 삽입됨 */</style>
</head>
```

---

##### MiniCssExtractPlugin.loader

| 항목      | 내용                                                                                |
| --------- | ----------------------------------------------------------------------------------- |
| 입력      | webpack 모듈화된 CSS                                                                |
| 출력      | 별도 `.css` 파일                                                                    |
| 역할      | CSS를 JS 번들에서 분리해 독립적인 파일로 추출합니다                                 |
| 사용 환경 | **프로덕션 전용** — JS 로드 이전에 CSS를 병렬로 받을 수 있어 초기 렌더링이 빠릅니다 |

```
빌드 후 브라우저 DOM:
<head>
  <link rel="stylesheet" href="assets/css/main.a1b2c3.css">
</head>
```

---

##### Asset Module — 웹폰트

별도 로더 없이 webpack 내장 `type: 'asset/resource'`로 처리합니다.
`generator.filename`으로 이미지와 별도 폴더(`assets/fonts/`)에 분리 출력합니다.

| 포맷    | 설명                                       |
| ------- | ------------------------------------------ |
| `woff2` | 최신 브라우저 권장 포맷. 가장 작은 파일 크기 |
| `woff`  | `woff2` 미지원 구형 브라우저 대응           |
| `ttf`   | 레거시 Android/iOS 대응                    |
| `otf`   | OpenType 폰트 (ttf 와 유사한 용도)         |
| `eot`   | IE 전용 레거시 포맷                        |

```js
// webpack.common.js
{
  test: /\.(woff2?|ttf|otf|eot)$/i,
  type: 'asset/resource',
  generator: { filename: 'assets/fonts/[name][hash][ext]' },
}
```

CSS/SCSS에서 `@font-face`로 불러옵니다:

```scss
// src/styles/main.scss
@font-face {
  font-family: 'Pretendard';
  src: url('../fonts/Pretendard-Regular.woff2') format('woff2'),
       url('../fonts/Pretendard-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap; // 폰트 로드 전 fallback 폰트 표시 → CLS 최소화
}
```

---

##### Asset Module — 비디오

웹폰트와 동일하게 `type: 'asset/resource'`로 처리합니다.
import한 변수가 URL 문자열로 반환되어 `<video src>` 등에 직접 사용할 수 있습니다.

| 포맷   | 설명                                                 |
| ------ | ---------------------------------------------------- |
| `mp4`  | 범용 포맷. 모든 브라우저·디바이스에서 지원           |
| `webm` | 오픈 포맷. mp4 대비 고압축 (Chrome·Firefox·Edge 지원) |
| `ogg`  | Firefox 중심 오픈 포맷 (현재는 webm 선호)             |

```js
// webpack.common.js
{
  test: /\.(mp4|webm|ogg)$/i,
  type: 'asset/resource',
  generator: { filename: 'assets/media/[name][hash][ext][query]' },
}
```

TypeScript/JavaScript에서 import해서 사용합니다:

```ts
// src/components/HeroSection.ts
import videoSrc from '../assets/intro.mp4';

const video = document.createElement('video');
video.src = videoSrc; // webpack이 'assets/media/intro.abc123.mp4' 로 치환
video.autoplay = true;
video.muted = true;
```

---

> **style-loader vs MiniCssExtractPlugin.loader 비교**
>
> |                | style-loader                    | MiniCssExtractPlugin.loader |
> | -------------- | ------------------------------- | --------------------------- |
> | CSS 위치       | JS 내부 (런타임 `<style>` 삽입) | 별도 `.css` 파일            |
> | HMR 지원       | ✅ 즉시 반영                    | ❌ 미지원                   |
> | 초기 로딩 속도 | 느림 (JS 파싱 후 적용)          | 빠름 (CSS·JS 병렬 다운로드) |
> | 사용 환경      | 개발                            | 프로덕션                    |

---

### Plugin(플러그인)

로더가 **파일 단위 변환**을 담당한다면, 플러그인은 **빌드 전체 과정**에 기능을 추가합니다.
`new Plugin()` 형태로 인스턴스를 생성해 `plugins` 배열에 넣습니다.

#### 일반적으로 사용되는 플러그인들

---

##### HtmlWebpackPlugin

**문제**: 빌드할 때마다 JS 파일명에 해시가 바뀝니다(`main.a1b2c3.js`).
HTML에 이 경로를 직접 작성해두면 빌드할 때마다 수동으로 고쳐야 합니다.

**해결**: 템플릿 HTML을 읽어 빌드된 JS/CSS 파일 경로를 `<script>`, `<link>` 태그로 자동 삽입한 최종 HTML을 생성합니다.

```js
new HtmlWebpackPlugin({
  template: './src/index.html', // 기준이 될 템플릿 파일
});
```

```
src/index.html (입력)       →    dist/index.html (출력)

<html>                           <html>
  <body>                           <body>
    <div id="root"></div>            <div id="root"></div>
  </body>                            <script src="assets/js/main.a1b2.js"></script>
</html>                            </body>
                                 </html>
```

---

##### DefinePlugin

**문제**:

- 소스 코드에서 `process.env.APP_API_URL` 같은 환경 변수를 참조하면, 브라우저 번들에 `process.env`가 그대로 남아 런타임 오류가 발생합니다.
- 브라우저에는 Node.js의 `process` 객체가 없기 때문입니다.

**해결**:

- 빌드 시점에 `process.env.APP_API_URL` 같은 식별자를 실제 문자열 리터럴로 교체합니다.
- 번들 결과물에는 변수 참조 대신 실제 값이 하드코딩됩니다.

```js
new DefinePlugin({
  'process.env': JSON.stringify(clientEnvRaw),
  'process.env.APP_ENV': JSON.stringify('production'),
});
```

```
소스 코드:      console.log(process.env.APP_ENV)
빌드 결과물:    console.log("production")        ← 리터럴로 치환됨
```

> **보안 주의**: DefinePlugin으로 주입된 값은 JS 번들 파일 안에 평문으로 포함됩니다.
> 비밀번호·API 시크릿처럼 외부에 노출되면 안 되는 값은 절대 `APP_` 접두사로 넣지 마세요.

---

##### MiniCssExtractPlugin

CSS를 JS 번들 안에 포함시키지 않고 별도 `.css` 파일로 추출합니다.

`MiniCssExtractPlugin.loader`가 로더 파이프라인에서 추출 작업을 수행하고,
이 플러그인 인스턴스가 추출된 내용을 파일로 기록하는 역할을 합니다.

```js
new MiniCssExtractPlugin({
  filename: 'assets/css/[name].[contenthash].css',
});
```

> `MiniCssExtractPlugin.loader`만 등록하고 이 플러그인 인스턴스를 빠뜨리면 빌드 오류가 발생합니다.
> 로더와 플러그인이 세트로 동작합니다.

---

##### ProgressPlugin (webpack 내장)

별도 설치 없이 `webpack` 패키지에 내장된 플러그인입니다.
빌드 진행 상황을 터미널에 `0% ~ 100%` 형태로 실시간 출력합니다.

```js
new webpack.ProgressPlugin({ percentBy: 'entries' });
```

---

### 로더 vs 플러그인 — 핵심 차이

둘 다 webpack을 확장하는 도구지만 **동작 시점과 대상**이 완전히 다릅니다.

#### 한 문장 정의

- **로더**: "이 파일 형식을 webpack이 이해할 수 있는 형태로 변환해줘"
- **플러그인**: "빌드 과정의 특정 시점에 이 기능을 실행해줘"

#### 비교표

| 구분 | 로더 | 플러그인 |
| ---- | ---- | -------- |
| 동작 단위 | **파일 1개** | **빌드 전체** |
| 동작 시점 | 모듈 해석 단계 (`import` 추적 중) | 빌드 생명주기 어느 시점이든 |
| 역할 | 파일 형식 변환 (TS→JS, SCSS→CSS) | HTML 생성, env 치환, CSS 추출, 진행률 출력 등 |
| 적용 방법 | `module.rules`에 선언 | `plugins` 배열에 인스턴스 추가 |
| 반환값 | 변환된 소스 코드 | 없음 (빌드 결과물에 직접 작용) |
| 예시 | `ts-loader`, `css-loader`, `sass-loader` | `HtmlWebpackPlugin`, `DefinePlugin`, `MiniCssExtractPlugin` |

#### 빌드 파이프라인 안에서의 위치

```
[entry 파일 발견]
       ↓
[로더 실행 구간] ← 로더는 오직 이 구간에서만 동작
  import된 .ts  → ts-loader          → JS 모듈
  import된 .scss → sass-loader
                   → css-loader
                   → style-loader     → DOM 주입
  import된 .mp4  → asset/resource    → URL 문자열
       ↓
[모듈 그래프 완성 — 모든 import 해석 완료]
       ↓
┌─────────────────────────────────────────────┐
│ [플러그인 실행 가능 구간]                    │
│  ├ 빌드 시작 직후                           │
│  ├ 모듈 처리 완료 후 (DefinePlugin 치환)    │
│  ├ 청크 최적화 후 (MiniCssExtractPlugin)    │
│  └ 파일 출력 직전 (HtmlWebpackPlugin)       │
└─────────────────────────────────────────────┘
       ↓
[dist/ 파일 출력]
```

#### 왜 헷갈리는가 — MiniCssExtractPlugin

`MiniCssExtractPlugin`은 **로더**(`MiniCssExtractPlugin.loader`)와 **플러그인**(`new MiniCssExtractPlugin()`) 두 가지가 세트로 동작합니다.

```
로더 역할:  CSS 모듈 처리 중 "이 CSS를 파일로 뽑아낼 것" 이라고 표시
플러그인 역할: 로더가 표시해둔 CSS를 모아 실제 .css 파일로 기록
```

로더만 등록하고 플러그인 인스턴스를 빠뜨리거나, 반대로 플러그인만 넣고 로더를 빠뜨리면 모두 빌드 오류가 발생합니다.

---

### Dev Server

로컬 개발 서버입니다(`webpack-dev-server` 패키지).
`dist/` 파일을 직접 열지 않아도 `http://localhost:5173` 으로 앱을 확인할 수 있습니다.

- 파일 변경을 감지해 자동으로 재빌드합니다
- HMR이 활성화된 경우 페이지 전체 새로고침 없이 바뀐 부분만 교체합니다
- 빌드 결과물을 디스크에 쓰지 않고 메모리에서 바로 제공해 속도가 빠릅니다

```js
// webpack.dev.js
export default {
  devServer: {
    port: 5173,   // http://localhost:5173 으로 접속
    hot: true,    // HMR 활성화
    open: false,  // 서버 시작 시 브라우저 자동 실행 안 함
  },
};
```

---

### HMR(Hot Module Replacement)

페이지 전체를 새로고침하지 않고 **변경된 모듈만** 런타임에 교체하는 기술입니다.
개발 서버가 파일 변경을 감지하면, 브라우저와 웹소켓으로 연결해 해당 모듈만 새로 전달합니다.

```
[파일 저장]
     ↓
webpack-dev-server 파일 변경 감지
     ↓
변경된 모듈만 재컴파일
     ↓
웹소켓으로 브라우저에 전달
     ↓
페이지 새로고침 없이 해당 모듈만 교체
```

**새로고침 방식과 비교**:

|                    | 전체 새로고침 | HMR         |
| ------------------ | ------------- | ----------- |
| 입력값·스크롤 위치 | 초기화됨      | 유지됨      |
| 재빌드 범위        | 전체          | 변경 모듈만 |
| 개발 속도          | 느림          | 빠름        |

---

## 4) dev/prod 동작 흐름 (텍스트 다이어그램)

아래는 예시를 기준으로 `entry -> loader -> plugin -> output`이 어떻게 흘러가는지 텍스트로 표현한 것입니다.
명령어/파일명은 하나의 샘플이며, 본인 프로젝트 이름에 맞게 바꿔 적용하면 됩니다.

### 개발(dev) 빌드 흐름

```text
[명령]
pnpm serve:dev
   |
   v
[설정 로드]
webpack.dev.js + webpack.common.js (merge)
   |
   v
[mode=development, devtool=eval-source-map]
   |
   v
[entry]
src/index.ts
   |
   v
[의존성 그래프 수집]
TS/SCSS/이미지/폰트/비디오 import 추적
   |
   +--> TS 파일: ts-loader
   |
   +--> SCSS 파일: sass-loader -> css-loader -> style-loader
   |                 (최종 CSS를 <style>로 DOM 주입, HMR 즉시 반영)
   |
   +--> 이미지: asset/resource → dist/assets/media/*
   |
   +--> 웹폰트 (.woff2/.woff/.ttf 등): asset/resource → dist/assets/fonts/*
   |
   +--> 비디오 (.mp4/.webm/.ogg): asset/resource → dist/assets/media/*
   |
   v
[plugins]
HtmlWebpackPlugin (index.html에 번들 경로 자동 주입)
DefinePlugin (process.env.* 치환)
ProgressPlugin (터미널 진행률 출력)
   |
   v
[output]
dist/assets/js/[name].js
dist/assets/media/*   (이미지, 비디오)
dist/assets/fonts/*   (웹폰트)
   |
   v
[devServer]
http://localhost:5173 에서 메모리 번들 서빙 + HMR
```

### 배포(prod) 빌드 흐름

```text
[명령]
pnpm build:live (또는 build:qa, build:dev)
   |
   v
[설정 로드]
webpack.prod.js + webpack.common.js (merge)
   |
   v
[mode=production, devtool=source-map]
   |
   v
[entry]
src/index.ts
   |
   v
[의존성 그래프 수집]
TS/SCSS/이미지/폰트/비디오 import 추적
   |
   +--> TS 파일: ts-loader
   |
   +--> SCSS 파일: sass-loader -> css-loader -> MiniCssExtractPlugin.loader
   |                 (CSS를 JS에서 분리해 별도 파일 생성)
   |
   +--> 이미지: asset/resource → dist/assets/media/*
   |
   +--> 웹폰트 (.woff2/.woff/.ttf 등): asset/resource → dist/assets/fonts/*
   |
   +--> 비디오 (.mp4/.webm/.ogg): asset/resource → dist/assets/media/*
   |
   v
[plugins]
HtmlWebpackPlugin (최종 index.html 생성)
DefinePlugin (환경변수 문자열 치환)
MiniCssExtractPlugin (assets/css/[name].[contenthash].css 생성)
   |
   v
[output]
dist/assets/js/[name].[contenthash].js
dist/assets/css/[name].[contenthash].css
dist/assets/media/*   (이미지, 비디오)
dist/assets/fonts/*   (웹폰트)
dist/index.html
```

---

## 5) 개발/배포의 차이

개발 모드(`development`):

- 빠른 빌드
- 디버깅 편의성 중심
- HMR 사용
- CSS를 JS 안에 주입 (`style-loader`)

배포 모드(`production`):

- 파일 크기 최적화(압축/트리쉐이킹)
- 캐시를 위한 파일명 해시 사용
- 실제 배포 가능한 산출물 생성
- CSS를 별도 파일로 추출 (`MiniCssExtractPlugin`)
