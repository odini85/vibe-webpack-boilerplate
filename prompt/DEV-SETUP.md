# Webpack 기반 프런트엔드 개발환경 설계

요구사항(핫로딩, TypeScript, SCSS, 이미지 로더, HTML 템플릿, ESLint/Prettier, Vitest, pnpm)을 만족하는 최소 템플릿이다.

모든 명령은 프로젝트 루트에서 실행한다.

레거시 브라우저 지원이나 웹 서비스 운영 시 자주 쓰이는 옵션을 확장할 수 있도록 참고 항목을 아래에 포함했다.

## 사용 스택

- 번들러: webpack 5, webpack-cli, webpack-merge, webpack-dev-server (HMR)
- 언어: TypeScript 5
- 스타일: SCSS + sass-loader, css-loader, style-loader / MiniCssExtractPlugin (prod)
- 정적 자원: asset modules로 png/jpg/gif/svg 처리
- 템플릿: html-webpack-plugin (src/index.html)
- 환경변수: dotenv + DefinePlugin (3단계 병합, APP\_ 접두사 필터) + cross-env (크로스 플랫폼)
- 테스트: Vitest + jsdom + @testing-library/jest-dom
- 품질: ESLint(@typescript-eslint, import) + Prettier
- 패키지: pnpm (Node >= 18.17)

## 현재 기본 설정에 실제로 포함된 것

- HMR 개발 서버, TS 빌드(ts-loader), SCSS 파이프라인, asset modules 이미지 로딩, HTML 템플릿 주입.
- 프로덕션 시 CSS 분리(MiniCssExtractPlugin) 및 해시 파일명, dist 자동 clean.
- ESLint/Prettier 기본 규칙, Vitest(jsdom) 테스트, 타입 선언(이미지/SCSS).
- ES 모듈 기반 webpack 설정(webpack.common/dev/prod.js), webpack-merge로 공통 설정 재사용.
- 환경변수 관리: dotenv로 `.env` → `.env.<APP_ENV>` 순서로 로드 후 CLI 주입값이 최우선. `APP_*`, `APP_ENV`, `NODE_ENV` 키만 DefinePlugin으로 브라우저 번들에 주입.
- 환경별 dev/qa/live 서버 실행 및 빌드 스크립트, 정적 미리보기 서버(scripts/serve-dist.mjs).

## 기본 템플릿에 포함되지 않은 것(확장 필요)

- Babel 트랜스파일(레거시 브라우저용), PostCSS/Autoprefixer, 이미지 최적화,
  코드 스플리팅/런타임 청크 커스터마이즈, 번들 분석, gzip/br 사전 압축.

## 스크립트

개발 서버 (APP_ENV에 따라 로드되는 .env 파일이 다름):

- `pnpm serve:dev` : APP_ENV=dev, `.env` + `.env.dev` 로드
- `pnpm serve:qa` : APP_ENV=qa, `.env` + `.env.qa` 로드
- `pnpm serve:live` : APP_ENV=live, `.env` + `.env.live` 로드

프로덕션 빌드:

- `pnpm build:dev` : APP_ENV=dev 빌드
- `pnpm build:qa` : APP_ENV=qa 빌드
- `pnpm build:live` : APP_ENV=live 빌드

미리보기:

- `pnpm preview` : `dist/`를 정적 서버로 실행 (기본 포트 4173)
- `pnpm build:preview` : `pnpm build:live` 후 바로 `pnpm preview` 실행

코드 품질:

- `pnpm typecheck` : TS 타입 검사만 수행 (파일 출력 없음)
- `pnpm lint` / `pnpm lint:fix` : ESLint 실행
- `pnpm format` : Prettier 포맷팅
- `pnpm test` / `pnpm test:watch` : Vitest 실행

## 설치 절차

1. `pnpm install`
2. 개발 서버 시작: `pnpm serve:dev`

## 프로젝트 구조

- `src/index.ts` : 엔트리, HMR 설정 및 Vitest 환경 자동 렌더 방지 포함
- `src/index.html` : HTML 템플릿
- `src/styles/main.scss` : 전역 스타일 예시
- `src/assets/logo.png` : 에셋 로딩 예시
- `src/types/assets.d.ts` : 이미지/SCSS 모듈 선언
- `src/__tests__/app.test.ts` : DOM 생성 유닛 테스트(Vitest/jsdom)
- `scripts/serve-dist.mjs` : `pnpm preview`용 순수 Node.js 정적 파일 서버
- `webpack.common.js` : 공통 설정(엔트리, 로더, 에셋, 환경변수, HtmlPlugin)
- `webpack.dev.js` : 개발 모드(HMR, style-loader, devServer)
- `webpack.prod.js` : 프로덕션 모드(MiniCssExtractPlugin, clean)
- `tsconfig.json` : TS 컴파일러 설정
- `.eslintrc.cjs` / `.prettierrc` / `.browserslistrc` : 품질/타겟 환경 설정
- `vitest.config.ts` / `vitest.setup.ts` : 테스트 설정
- `.env.example` : 환경변수 키 목록 및 설명 샘플
- `.env.dev` / `.env.qa` / `.env.live` : 환경별 실제 환경변수 파일

## 메모

- 이미지/스타일 import 타입 오류 방지용 선언이 포함돼 있다 (`src/types/assets.d.ts`).
- webpack은 ESM 구성 파일을 사용한다. Node 18+ 기준으로 동작.
- 추가 에셋 로더가 필요하면 `webpack.common.js`의 `module.rules`에 asset module 또는 loader를 확장한다.
- `tsconfig.json`은 `moduleResolution: bundler`를 사용한다. TS 5+에서 ts-loader와 호환되지만, 구버전 환경에서 문제 시 `node`로 낮추는 것을 고려.
- ESLint는 8.x(.eslintrc 기반)으로 고정해 둬 v9의 flat-config 전환 비용을 피했다.
- 엔트리(`src/index.ts`)는 테스트 시 DOM 부재로 인한 실패를 피하기 위해 `process.env.VITEST`가 아닐 때만 자동 렌더한다.
- 환경변수 우선순위: `CLI 직접 주입 > .env.<APP_ENV> > .env`. 빌드/서버 스크립트에서 `APP_ENV`를 통해 환경을 선택하고, 민감 정보는 `.env` 파일에 커밋하지 않는다.
- `pnpm preview`는 webpack-dev-server가 아닌 `scripts/serve-dist.mjs`(순수 Node.js http 서버)로 동작한다. `PORT` 환경변수로 포트를 변경할 수 있다(기본 4173).
- `cross-env`: `KEY=value command` 문법은 Unix/Mac 전용이라 Windows cmd/PowerShell에서 동작하지 않는다. `cross-env`가 `package.json` 스크립트의 `APP_ENV` 설정을 모든 OS에서 동일하게 처리한다.

## 레거시 브라우저 대응(바벨) 추가 고려

- 필요성: IE11 등 ES5 대상이거나 오래된 크롬/사파리 지원 시 TS→ES5 트랜스파일 필요.
- 설치 예시: `pnpm add -D @babel/core @babel/preset-env @babel/preset-typescript babel-loader core-js regenerator-runtime`
- 패키지 예시(devDeps): `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript`, `babel-loader`, `core-js`, `regenerator-runtime`.
- 설정 예시:
  - `babel-loader`를 `ts-loader` 대신(또는 `ts-loader`의 `transpileOnly`와 `babel-loader`를 조합) 사용.
  - `.babelrc` 또는 `babel` 필드에:
    ```json
    {
      "presets": [
        [
          "@babel/preset-env",
          { "useBuiltIns": "usage", "corejs": 3, "targets": ">0.5%, not dead" }
        ],
        "@babel/preset-typescript"
      ]
    }
    ```
  - `webpack.common.js` rules 예시:
    ```js
    {
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: 'babel-loader',
    }
    ```
- 폴리필: `core-js` / `regenerator-runtime` 자동 삽입(`useBuiltIns: 'usage'`)을 위해 entry 수정 불필요.

## 웹 서비스용 Webpack 자주 쓰는 옵션 체크리스트

- 코드 스플리팅/캐시 전략: `optimization.splitChunks`, `runtimeChunk: 'single'`, 파일명에 `[contenthash]`.
- 소스맵: 개발 `devtool: 'eval-source-map'`, 운영 `devtool: 'source-map'` 또는 필요 시 끄기.
- 경로 별칭: `resolve.alias`로 `@` → `src` 등 설정, TS는 `paths`와 동기화.
- 정적 자원: `asset/resource` 외에 `asset/inline`(소형), `asset`(자동 스위치) 조합.
- 이미지/폰트 최적화: `image-minimizer-webpack-plugin`(prod), `asset modules`의 `dataUrlCondition` 조정.
- 스타일 후처리: PostCSS(`postcss-loader`, `autoprefixer`)를 SCSS 파이프라인에 추가.
- HTML 템플릿: `HtmlWebpackPlugin` 옵션으로 `meta`, `favicon`, `scriptLoading: 'defer'`, `minify`(prod) 설정.
- 개발 서버: `devServer.historyApiFallback`(SPA), `proxy`(API 서버 연동), `client.overlay`(에러 오버레이).
- 번들 분석: `webpack-bundle-analyzer`를 필요 시 `pnpm run build:live -- --profile` 등의 커스텀 스크립트로 연결.
- 압축 전송: 배포 시 `compression-webpack-plugin`으로 gzip/br 사전 빌드하거나 리버스프록시에서 처리.

### 코드 스플리팅 및 런타임 청크 예시

```js
// webpack.prod.js (예시)
export default merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single',
  },
});
```

### 번들 분석 예시

- 설치: `pnpm add -D webpack-bundle-analyzer`
- 사용: `pnpm run build:live -- --profile --json > stats.json && pnpm exec webpack-bundle-analyzer stats.json`
- 또는 `webpack.prod.js`에 플러그인 추가:
  ```js
  import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
  plugins: [new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false })];
  ```

### 기본 CI 파이프라인 예시

- GitHub Actions `.github/workflows/ci.yml` 개략:
  ```yaml
  name: ci
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
          with: { version: 9 }
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: pnpm install --frozen-lockfile
        - run: pnpm typecheck
        - run: pnpm lint
        - run: pnpm test
        - run: pnpm build:live
  ```
- 최소 단계 권장 순서: 의존성 설치 → typecheck → lint → test → build.

### PostCSS 추가 예시

- 설치: `pnpm add -D postcss postcss-loader autoprefixer`
- `postcss.config.cjs`:
  ```js
  module.exports = {
    plugins: [require('autoprefixer')],
  };
  ```
- `webpack.dev.js` / `webpack.prod.js`의 SCSS rule에 `postcss-loader`를 `css-loader`와 `sass-loader` 사이에 배치.
