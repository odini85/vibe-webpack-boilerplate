# CI/CD 환경에서 환경변수 처리

문서에 나오는 파일명(`webpack.common.js`)과 스크립트명(`pnpm build:qa` 등)은 예시입니다.
실제 프로젝트에서는 동일한 역할의 파일/명령으로 치환해 적용하세요.

## 1) 왜 .env 파일이 gitignore 되어 있는가

`.gitignore`에는 아래와 같이 설정되어 있습니다.

```
.env
.env.*
```

`.env.dev`, `.env.qa`, `.env.live` 모두 저장소에 커밋되지 않습니다.

**이유**: `.env` 파일에는 API 엔드포인트, 피처 플래그, 서비스 키 등 **환경마다 다른 값**이 들어갑니다.
이 값들이 git 히스토리에 남으면 외부에 노출될 위험이 있습니다.
특히 `APP_` 접두사 값은 브라우저 번들에 그대로 포함되므로, 어떤 값을 넣을지 신중하게 관리해야 합니다.

---

## 2) CI/CD에서 .env 파일이 없으면 어떻게 되는가

`webpack.common.js`의 dotenv 로드 부분을 보면:

```js
const baseEnv    = loadEnv({ path: '.env' }).parsed ?? {};           // 없으면 {}
const profileEnv = loadEnv({ path: `.env.${appEnv}` }).parsed ?? {}; // 없으면 {}
const mergedEnv  = { ...baseEnv, ...profileEnv, ...process.env };    // 프로세스 환경변수로 덮어씀
```

파일이 없어도 **오류가 발생하지 않습니다.** dotenv는 파일이 없으면 빈 객체 `{}`를 반환하고,
`mergedEnv`는 `...process.env`로 CI 서버가 주입한 환경변수를 직접 받습니다.

결국 CI/CD에서의 동작 순서는:

```
.env 파일 로드 시도 → 없으면 {}
.env.<APP_ENV> 로드 시도 → 없으면 {}
process.env (CI 서버가 주입한 값)로 최종 덮어쓰기
↓
APP_* / APP_ENV / NODE_ENV 만 필터링
↓
DefinePlugin으로 번들에 정적 리터럴 주입
```

**즉, CI/CD에서는 .env 파일 대신 CI 플랫폼의 환경변수 설정 화면(또는 파이프라인 설정 파일)에
`APP_ENV`, `APP_API_BASE_URL` 등을 직접 입력하면 됩니다.**

---

## 3) CI/CD에서 설정해야 하는 환경변수 목록

`.env.example`을 기준으로 각 환경에 필요한 값을 파악합니다.

```bash
# .env.example
APP_NAME=webpack-boilerplate
APP_FEATURE_FLAG=false

# 환경별로 달라지는 값
APP_ENV=live
APP_API_BASE_URL=https://api.example.com
```

CI/CD에 설정할 변수:

| 변수 | 역할 | 예시 |
|------|------|------|
| `APP_ENV` | 환경 식별자. 어떤 .env 파일을 로드할지 결정 | `dev` / `qa` / `live` |
| `APP_NAME` | 앱 이름 | `My Service` |
| `APP_API_BASE_URL` | API 서버 주소 | `https://api.example.com` |
| `APP_FEATURE_FLAG` | 피처 플래그 | `true` / `false` |

> **주의**: CI 환경에서 `.env` 파일이 없으면 공통 기본값(`APP_NAME` 등)도 적용되지 않습니다.
> 필요한 모든 변수를 CI 플랫폼에 명시적으로 등록해야 합니다.

---

## 4) 플랫폼별 설정 방법

### GitHub Actions

GitHub 저장소 → Settings → Secrets and variables → Actions 에서 등록합니다.

- **Secrets**: 민감한 값 (암호화 저장, 로그에 마스킹됨)
- **Variables**: 비민감한 값 (평문 저장)

예시 기준의 `APP_*` 값은 브라우저에 노출되는 값이므로 **Variables** 또는 **Secrets** 중 선택합니다.
API 엔드포인트처럼 공개해도 무방한 값은 Variables, URL에 인증 정보가 포함되면 Secrets를 사용합니다.

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: pnpm install --frozen-lockfile

      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

      - name: Build (live)
        run: pnpm build:live
        env:
          # GitHub Variables / Secrets 에서 주입
          APP_NAME: ${{ vars.APP_NAME }}
          APP_API_BASE_URL: ${{ secrets.APP_API_BASE_URL }}
          APP_FEATURE_FLAG: ${{ vars.APP_FEATURE_FLAG }}
          # APP_ENV 는 build:live 스크립트가 cross-env 로 자동 설정
          # 필요하다면 명시적으로 추가 가능
          # APP_ENV: live
```

여러 환경(dev/qa/live)에 각각 배포해야 한다면 **Environments** 기능을 활용합니다.

```yaml
jobs:
  build-qa:
    runs-on: ubuntu-latest
    environment: qa          # GitHub → Settings → Environments → qa 에 등록된 값 사용
    steps:
      - ...
      - run: pnpm build:qa
        env:
          APP_API_BASE_URL: ${{ secrets.APP_API_BASE_URL }}  # qa 환경에 등록된 값

  build-live:
    runs-on: ubuntu-latest
    environment: live        # live 환경에 등록된 값 사용
    steps:
      - ...
      - run: pnpm build:live
        env:
          APP_API_BASE_URL: ${{ secrets.APP_API_BASE_URL }}  # live 환경에 등록된 값
```

---

### GitLab CI/CD

GitLab 프로젝트 → Settings → CI/CD → Variables 에서 등록합니다.

- **Protected**: 보호된 브랜치/태그에서만 사용 가능
- **Masked**: 로그에서 마스킹 (민감한 값에 사용)
- **Environment scope**: 특정 환경 이름(`production`, `staging` 등)에만 적용

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build

variables:
  # 파이프라인 전체 공통값 (GitLab Variables에 등록한 값이 자동으로 process.env에 주입됨)
  NODE_VERSION: "20"

test:
  stage: test
  image: node:20
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm typecheck
    - pnpm lint
    - pnpm test

build-qa:
  stage: build
  image: node:20
  environment:
    name: qa
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm build:qa
  # APP_API_BASE_URL 등은 GitLab Variables에서
  # Environment scope = qa 로 등록하면 이 job에서만 적용됨
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

build-live:
  stage: build
  image: node:20
  environment:
    name: production
  before_script:
    - corepack enable
    - pnpm install --frozen-lockfile
  script:
    - pnpm build:live
  # Environment scope = production 으로 등록된 APP_* 값이 적용됨
  artifacts:
    paths:
      - dist/
  only:
    - main
```

GitLab Variables는 파이프라인 실행 시 자동으로 `process.env`에 주입되므로
별도의 `env:` 블록 없이도 webpack.common.js가 읽을 수 있습니다.

---

### Jenkins

Jenkins에서 환경변수를 관리하는 방법은 두 가지입니다.

**방법 1 — Credentials + withCredentials (민감한 값)**

Jenkins 관리 → Credentials → Secret text 로 등록 후 Jenkinsfile에서 참조합니다.

```groovy
// Jenkinsfile
pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'  // Jenkins → Global Tool Configuration 에서 설정
    }

    environment {
        // 비민감 공통값은 여기에 직접 작성
        APP_NAME = 'My Service'
        APP_FEATURE_FLAG = 'true'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm install -g pnpm'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Test') {
            steps {
                sh 'pnpm typecheck'
                sh 'pnpm lint'
                sh 'pnpm test'
            }
        }

        stage('Build QA') {
            when { branch 'develop' }
            steps {
                // withCredentials 블록 안에서만 해당 값이 환경변수로 주입됨
                withCredentials([
                    string(credentialsId: 'qa-api-url', variable: 'APP_API_BASE_URL')
                ]) {
                    sh 'pnpm build:qa'
                }
            }
        }

        stage('Build Live') {
            when { branch 'main' }
            steps {
                withCredentials([
                    string(credentialsId: 'live-api-url', variable: 'APP_API_BASE_URL')
                ]) {
                    sh 'pnpm build:live'
                }
            }
        }
    }
}
```

**방법 2 — EnvInject Plugin (비민감한 값)**

Jenkins 플러그인 "Environment Injector"를 설치하면 job 설정 화면에서
Key=Value 형태로 환경변수를 직접 등록할 수 있습니다.

```
APP_NAME=My Service
APP_FEATURE_FLAG=true
APP_ENV=live
```

---

### Vercel

Vercel은 정적 파일 배포에 특화된 플랫폼으로, `dist/`를 바로 업로드하거나
Vercel이 직접 빌드 명령을 실행하게 설정할 수 있습니다.

**설정 위치**: Vercel 프로젝트 → Settings → Environment Variables

환경(Production / Preview / Development)별로 변수를 등록합니다.

```
# Vercel 설정 화면에서 입력
Variable Name: APP_API_BASE_URL
Value: https://api.example.com
Environment: Production

Variable Name: APP_API_BASE_URL
Value: https://qa.api.example.com
Environment: Preview
```

**vercel.json 빌드 명령 설정**:

```json
{
  "buildCommand": "pnpm build:live",
  "outputDirectory": "dist",
  "installCommand": "pnpm install"
}
```

Vercel이 빌드를 실행할 때 등록된 환경변수가 `process.env`에 자동 주입됩니다.

---

### Netlify

Netlify도 Vercel과 유사합니다.

**설정 위치**: Netlify 사이트 → Site configuration → Environment variables

```toml
# netlify.toml
[build]
  command = "pnpm build:live"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  # APP_* 값은 Netlify UI에서 등록 (민감한 값이 설정 파일에 노출되지 않도록)
```

---

## 5) 동작 원리 한눈에 보기

```
로컬 개발                     CI/CD 빌드 서버
─────────────────────         ──────────────────────────────
.env (로컬 파일)               존재하지 않음 → {} 로 처리
.env.qa (로컬 파일)            존재하지 않음 → {} 로 처리
process.env (쉘 변수)          플랫폼이 주입한 환경변수
                              (GitHub Secrets / GitLab Variables /
                               Jenkins Credentials / Vercel Env 등)

       ↓ mergedEnv = { ...baseEnv, ...profileEnv, ...process.env }
       ↓ APP_* / APP_ENV / NODE_ENV 필터링
       ↓ DefinePlugin으로 번들에 리터럴 치환
       ↓
     dist/ (브라우저 실행 파일)
```

플랫폼이 달라도 핵심 원리는 같습니다:
**파일이 없으면 플랫폼의 환경변수가 자동으로 그 역할을 대체합니다.**

---

## 6) 체크리스트

CI/CD를 처음 설정할 때 이 목록을 순서대로 확인합니다.

- [ ] `.env.example`을 열어 필요한 키 목록을 파악한다
- [ ] 각 CI 환경(qa/live 등)에 필요한 `APP_*` 값을 플랫폼 변수 화면에 등록한다
- [ ] 파이프라인에서 빌드 스크립트(`pnpm build:qa` 등)를 실행한다
- [ ] 빌드 후 `dist/` 산출물에서 올바른 값이 번들에 포함됐는지 확인한다
  ```bash
  # dist/assets/js/main.*.js 파일 안에서 APP_ 값을 검색해 확인
  grep -r "APP_API_BASE_URL" dist/
  ```
- [ ] 민감값(`DB_PASSWORD` 등)이 `APP_` 접두사로 등록되지 않았는지 이중 확인한다
