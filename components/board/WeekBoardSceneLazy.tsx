"use client";

import dynamic from "next/dynamic";

// three는 무거워서 홈의 첫 로딩 JS에서 분리한다.
// WebGL은 브라우저에서만 동작하므로 서버에서는 그리지 않는다.
// 장면이 준비될 때까지는 WeekBoardView가 같은 크기의 정적 돌을 보여준다.
const WeekBoardSceneLazy = dynamic(() => import("./WeekBoardScene"), {
  ssr: false,
});

export default WeekBoardSceneLazy;
