import { useEffect, useState } from "react";

// WebGL 지원 여부: 한 번만 검사하고, 검사용 컨텍스트는 바로 반납한다.
let webglSupported: boolean | undefined;

function getWebGLSupport() {
  if (webglSupported === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupported = gl !== null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupported = false;
    }
  }
  return webglSupported;
}

/**
 * 3D 장면은 첫 화면이 다 그려진 뒤에야 켠다. 순서는
 * 페이지 로드 → 웹폰트 준비 → 첫 화면 그리기(requestAnimationFrame 두 번) → 브라우저가 한가할 때.
 * 무거운 3D 코드 다운로드와 WebGL 초기화가 헤드라인 표시나 첫 입력 처리와 경쟁하지 않게 하려는 것.
 * 빠른 네트워크에서는 load가 첫 화면보다 먼저 끝나기도 해서, 첫 화면 그리기를 따로 기다린다.
 * WebGL을 못 쓰는 기기면 계속 false라서, 호출하는 쪽은 정적인 대체 화면을 유지하면 된다.
 */
export function useWebGLAfterFirstPaint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let rafId: number | undefined;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const enable = () => {
      if (!cancelled) setReady(getWebGLSupport());
    };
    const scheduleIdle = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(enable, { timeout: 2500 });
      } else {
        // Safari는 requestIdleCallback이 없어서 짧게 미룬다.
        timer = setTimeout(enable, 1200);
      }
    };
    const afterFirstPaint = () => {
      if (cancelled) return;
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(scheduleIdle);
      });
    };
    const afterLoad = () => {
      // document.fonts가 없는 환경(오래된 브라우저, 테스트용 DOM)에서는 폰트를 기다리지 않는다.
      const fontsReady = "fonts" in document ? document.fonts.ready : Promise.resolve();
      fontsReady.then(afterFirstPaint, afterFirstPaint);
    };

    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", afterLoad);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return ready;
}
