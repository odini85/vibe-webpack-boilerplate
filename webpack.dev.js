import path from 'path';

// eslint-disable-next-line import/no-named-as-default
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import { registerMockApi } from './scripts/mock-api.mjs';
import common from './webpack.common.js';

/**
 * 개발 환경 webpack 설정
 *
 * webpack.common.js 를 기반으로 HMR 개발 서버·빠른 소스맵·빌드 진행률 플러그인을 추가합니다.
 * CSS 는 style-loader 로 DOM 에 직접 주입해 HMR 즉시 반영을 지원합니다.
 *
 * Mock API:
 *   USE_MOCK=true 환경변수가 설정된 경우 /api/* 요청을 로컬 핸들러로 처리합니다.
 *   scripts/mock-api.mjs 에서 핸들러를 추가·수정합니다.
 */
export default merge(common, {
  // 빠른 리빌드 우선 — 코드 압축·트리쉐이킹 비활성화
  mode: 'development',

  // eval 기반 소스맵 — 별도 파일 없이 빠른 리빌드와 정확한 원본 위치 모두 제공
  devtool: 'eval-source-map',

  // 에러·경고와 빌드 완료 메시지만 터미널에 출력
  stats: 'minimal',

  // 로더·플러그인 내부(인프라) 로그 출력 수준 제어
  infrastructureLogging: {
    // 로더·플러그인 내부 로그를 info 레벨까지 출력
    level: 'info',
  },

  // 개발 전용 출력 설정 — common.output 을 부분 override
  output: {
    // 개발 중 가독성을 위해 contenthash 없이 엔트리명만 사용
    filename: 'assets/js/[name].js',
    // 매 빌드 전 dist 디렉터리를 비워 이전 산출물 잔존 방지
    clean: true,
  },

  // webpack-dev-server 로컬 개발 서버 설정
  devServer: {
    // 빌드 산출물을 정적 파일로 제공할 디렉터리
    static: path.join(process.cwd(), 'dist'),
    // 변경된 모듈만 교체 — 전체 페이지 새로고침 없이 즉시 반영 (HMR)
    hot: true,
    // 개발 서버 수신 포트
    port: 5173,
    // 서버 시작 시 브라우저 자동 실행 비활성화
    open: false,

    // 브라우저(클라이언트) 측 HMR·오버레이 동작 설정
    client: {
      // 컴파일 에러를 브라우저 화면에 반투명 오버레이로 표시
      overlay: true,
      // 브라우저 콘솔의 HMR 관련 로그 출력 억제
      logging: 'none',
      // 브라우저 탭 타이틀에 컴파일 진행률(%) 표시
      progress: true,
    },

    // webpack-dev-middleware 단계의 번들 통계 출력 제어
    devMiddleware: {
      // 미들웨어 단계 번들 통계를 최소한으로만 출력
      stats: 'minimal',
    },

    // USE_MOCK=true 일 때 /api/* 요청을 scripts/mock-api.mjs 핸들러로 처리합니다.
    // webpack 미들웨어보다 먼저 실행되도록 middlewares 배열 앞에 삽입합니다.
    setupMiddlewares(middlewares, devServer) {
      if (process.env.USE_MOCK === 'true') {
        console.log('\n[mock-api] Mock API 활성화');
        registerMockApi(devServer.app);
        console.log();
      }
      return middlewares;
    },
  },

  // 개발 전용 플러그인 — common.plugins 에 추가로 병합됨
  plugins: [
    // 터미널에 0–100% 빌드 진행률을 실시간으로 출력
    new webpack.ProgressPlugin({
      // 엔트리 단위로 진행률 계산
      percentBy: 'entries',
    }),
  ],

  // 개발 전용 파일 변환 규칙 — common.module.rules 에 추가로 병합됨
  module: {
    rules: [
      {
        // sass-loader → css-loader → style-loader 순으로 파이프라인 실행
        // style-loader 가 최종 CSS 를 <style> 태그로 DOM 에 주입해 HMR 즉시 반영
        test: /\.s?css$/i,
        // 오른쪽부터 순차 실행: sass-loader(SCSS→CSS) → css-loader(url/import 해석) → style-loader(DOM 주입)
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
});
