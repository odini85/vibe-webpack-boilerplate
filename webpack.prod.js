import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { merge } from 'webpack-merge';

import common from './webpack.common.js';

/**
 * 프로덕션 환경 webpack 설정
 *
 * webpack.common.js 를 기반으로 JS 압축·트리쉐이킹·CSS 파일 분리를 적용합니다.
 * CSS 는 style-loader 대신 MiniCssExtractPlugin 으로 별도 파일에 추출해 병렬 로드를 지원합니다.
 */
export default merge(common, {
  // 코드 압축(Terser)·트리쉐이킹·스코프 호이스팅 자동 활성화
  mode: 'production',

  // 별도 .map 파일 생성 — DevTools 디버깅 가능, 일반 사용자에게는 노출되지 않음
  devtool: 'source-map',

  output: {
    // 빌드 전 dist 디렉터리를 비워 이전 산출물 잔존 방지
    clean: true,
  },

  module: {
    rules: [
      {
        // sass-loader → css-loader → MiniCssExtractPlugin.loader 순으로 파이프라인 실행
        // JS 번들에서 CSS 를 분리해 별도 파일로 추출 → 병렬 로드·캐시 효율 향상
        test: /\.s?css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },

  plugins: [
    // 추출된 CSS 파일에 contenthash 포함 — 내용 변경 시에만 캐시 무효화
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].[contenthash].css',
    }),
  ],
});
