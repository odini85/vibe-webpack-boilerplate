# Webpack + TypeScript Boilerplate

## 스펙

- Node.js `>=18.17`
- Package Manager: `pnpm`
- Bundler: `webpack@5` (`webpack-cli`, `webpack-dev-server`, `webpack-merge`)
- Language: `TypeScript@5`
- Style: `scss` (`sass`, `sass-loader`, `css-loader`, `style-loader`)
- Production CSS Extract: `mini-css-extract-plugin`
- HTML Template: `html-webpack-plugin`
- Test: `vitest`, `jsdom`, `@testing-library/jest-dom`
- Lint/Format: `eslint`, `prettier`
- Env: `dotenv` (`APP_`, `APP_ENV`, `NODE_ENV` 브라우저 주입)

## 프로젝트 실행 방법

| 구분 | 명령어 |
| --- | --- |
| 의존성 설치 | `pnpm install` |
| 개발 서버 (dev) | `pnpm serve:dev` |
| 개발 서버 (qa) | `pnpm serve:qa` |
| 개발 서버 (live) | `pnpm serve:live` |
| 빌드 (dev) | `pnpm build:dev` |
| 빌드 (qa) | `pnpm build:qa` |
| 빌드 (live) | `pnpm build:live` |
| 빌드 결과 실행 | `pnpm preview` |
| 빌드 후 바로 실행 | `pnpm build:preview` |
| 테스트 | `pnpm test` |
| 타입체크 | `pnpm typecheck` |
| 린트 | `pnpm lint` |
| 포맷 | `pnpm format` |
