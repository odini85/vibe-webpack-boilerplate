# 문서 목차

이 폴더는 FE 경험이 없어도 webpack 동작을 이해할 수 있도록 구성했습니다.

1. `docs/01-webpack-basics.md`
   - webpack이 무엇을 하는지
   - 번들링, 로더, 플러그인, 개발 서버의 기본 개념
2. `docs/02-webpack-options.md`
   - webpack 핵심 옵션(entry, output, resolve, module.rules, plugins, mode, devtool, devServer) 설명
3. `docs/03-project-config-walkthrough.md`
   - 예시 프로젝트의 `webpack.common.js`, `webpack.dev.js`, `webpack.prod.js`를 기준으로 실제 동작 해설
4. `docs/04-run-build-preview.md`
   - 실행/빌드/미리보기 절차
   - Mock API 미들웨어 (`pnpm serve:mock`, `scripts/mock-api.mjs`)
   - 환경변수 주입 방법
   - 자주 만나는 오류와 해결 방법
5. `docs/05-ci-cd-env.md`
   - .env 파일이 gitignore인 이유와 CI/CD에서의 동작 원리
   - GitHub Actions / GitLab CI / Jenkins / Vercel / Netlify 별 환경변수 설정 방법
   - 설정 체크리스트
