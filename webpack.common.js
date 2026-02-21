import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// eslint-disable-next-line import/no-named-as-default
import webpack from 'webpack';

/**
 * 개발·프로덕션 공통 webpack 설정
 *
 * APP_ENV 또는 NODE_ENV 에 따라 .env 파일을 계층적으로 로드하고,
 * 클라이언트에 안전한 환경 변수만 DefinePlugin 으로 번들에 주입합니다.
 */

// ESM 환경에서는 __dirname / __filename 이 기본 제공되지 않으므로
// import.meta.url 을 파일 경로로 변환한 뒤 dirname 으로 디렉터리 추출
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// APP_ENV 우선순위: CLI/쉘 직접 주입 > NODE_ENV > 기본값 'dev'
// 빌드 스크립트에서 APP_ENV=qa 처럼 명시하면 해당 값을 우선 사용
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'dev';

// 파일값을 먼저 합치고, 마지막에 현재 프로세스 환경변수로 덮어써 CLI 주입값을 최우선으로 유지
const baseEnv = loadEnv({ path: path.resolve(__dirname, '.env') }).parsed ?? {};
const profileEnv = loadEnv({ path: path.resolve(__dirname, `.env.${appEnv}`) }).parsed ?? {};
const mergedEnv = {
  ...baseEnv,
  ...profileEnv,
  ...process.env,
  APP_ENV: process.env.APP_ENV || appEnv,
};

// 브라우저 번들에 노출 가능한 키만 선별 (APP_* 접두사 또는 NODE_ENV / APP_ENV)
const clientEnvRaw = Object.fromEntries(
  Object.entries(mergedEnv).filter(
    ([key]) => key.startsWith('APP_') || key === 'NODE_ENV' || key === 'APP_ENV',
  ),
);

// DefinePlugin 치환용 맵 — process.env.KEY 형태 참조를 실제 문자열 리터럴로 치환
const defineEnv = Object.fromEntries(
  Object.entries(clientEnvRaw).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
);

// webpack 패키지에서 구조 분해 — named export 가 없어 default import 후 분해
const { DefinePlugin } = webpack;

export default {
  // 의존성 그래프 탐색 시작 파일 (TypeScript 엔트리)
  entry: './src/index.ts',

  output: {
    // 내용 기반 해시 — 파일 내용이 바뀔 때만 해시 변경되어 브라우저 캐시 효율 유지
    filename: 'assets/js/[name].[contenthash].js',
    // 번들이 기록될 절대 경로
    path: path.resolve(__dirname, 'dist'),
    // asset/resource 타입 정적 자산의 출력 파일명 패턴
    assetModuleFilename: 'assets/media/[name][hash][ext][query]',
  },

  resolve: {
    // 확장자 생략 import 허용 — 왼쪽부터 우선 탐색
    extensions: ['.ts', '.tsx', '.js'],
  },

  module: {
    rules: [
      {
        // .ts / .tsx → ts-loader 로 JavaScript 트랜스파일
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        // 이미지·SVG → 별도 파일로 출력, import 반환값은 URL 문자열
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        // 웹폰트 → assets/fonts/ 에 별도 파일로 출력
        // woff2: 최신 브라우저 권장 포맷 / woff: 구형 호환 / ttf·otf: 레거시 대응
        test: /\.(woff2?|ttf|otf|eot)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][hash][ext]',
        },
      },
      {
        // 비디오 → assets/media/ 에 별도 파일로 출력, import 반환값은 URL 문자열
        // mp4: 범용 / webm: 오픈 포맷 고압축 / ogg: Firefox 오픈 포맷 지원
        test: /\.(mp4|webm|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/media/[name][hash][ext][query]',
        },
      },
    ],
  },

  plugins: [
    // HTML 템플릿 기반으로 빌드된 JS/CSS 번들 경로를 script/link 태그로 자동 주입
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    // 빌드 시점에 process.env 참조를 정적 리터럴로 치환 (런타임에 process 객체 불필요)
    new DefinePlugin({
      'process.env': JSON.stringify(clientEnvRaw),
      ...defineEnv,
    }),
  ],
};
