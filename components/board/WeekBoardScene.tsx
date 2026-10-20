"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
// 필요한 클래스만 이름으로 가져와서 번들러가 쓰지 않는 three 코드를 덜어낼 수 있게 한다.
// (react-three-fiber는 three 전체를 등록해서 이게 불가능했고, 3D 청크가 훨씬 컸다.)
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import type { BoardDay, ScenePalette, WeekBoardModel } from "@/lib/weekBoard";
import type { EventColor } from "@/types";

type Props = {
  model: WeekBoardModel;
  selectedIndex: number | null;
  /** 화면에 보일 때만 애니메이션을 돌린다. */
  active: boolean;
  onReady: () => void;
};

// ── 테마 색과 동작 줄이기 설정 ──
// 3D 장면에서만 쓰므로, 홈 첫 로딩(하이드레이션) 때가 아니라 이 파일이 늦게 로드된 뒤에 읽는다.
// 테마는 ThemeToggle과 같은 방식으로 <html> 클래스와 시스템 설정 변화를 구독한다.
const PALETTE_VARS = [
  "--color-tile-default",
  "--color-tile-scheduled",
  "--color-accent-secondary",
  "--color-accent",
  "--color-bg",
] as const;
const LIGHT_DEFAULTS = ["#e0e0dd", "#c9d4c9", "#ff6b4a", "#ff4696", "#f7f7f5"];

let paletteCache: string | null = null;

function subscribeTheme(callback: () => void) {
  const onChange = () => {
    paletteCache = null;
    callback();
  };
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  mql.addEventListener("change", onChange);
  return () => {
    mql.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

function getPaletteSnapshot() {
  if (paletteCache === null) {
    const style = getComputedStyle(document.documentElement);
    paletteCache = PALETTE_VARS.map(
      (name, i) => style.getPropertyValue(name).trim() || LIGHT_DEFAULTS[i],
    ).join("|");
  }
  return paletteCache;
}

const getPaletteServerSnapshot = () => LIGHT_DEFAULTS.join("|");

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getReducedMotionServer = () => false;

const COLUMNS = 7;
const STONE_R = 0.4;
const STONE_H = 0.22;
const CAMERA_POSITION = { x: 0, y: 6.2, z: 4.6 };
const LOOK_AT_Y = 0.1;
const HOP_DURATION = 0.36;
const LAND_DURATION = 0.14;
const HOP_HEIGHT = 0.6;
const START_DELAY = 0.6;
const IDLE_BOB = 0.04;
const PAWN_SCALE = 0.85;
// 깃발은 돌 뒤쪽에 꽂히므로, 말은 깃발을 가리지 않게 돌 앞쪽에 선다.
const PAWN_Z = 0.06;
// 이동 중에는 매 프레임 그리지만, 제자리에서 살짝 튀는 연출은 초당 20번만 그려도 충분하다.
const IDLE_FRAME_MS = 50;
const POLE_HEIGHT = 0.44;

// 돌은 모두 같은 모양으로 한 줄에 똑바로 놓는다. 앞뒤로 살짝 납작한 타원이라 위에서 보면 징검돌처럼 보인다.
const STONE_DEPTH_SCALE = 0.92;
const SELECTED_LIFT = 0.14;

// EVENT_DOT_CLASSES(Tailwind 500 계열)와 같은 색. three는 CSS 클래스를 못 읽어서 값으로 둔다.
const FLAG_HEX: Record<EventColor, string> = {
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#6b7280",
};

const FLAG_X: Record<number, number[]> = {
  1: [0],
  2: [-0.15, 0.15],
  3: [-0.24, 0, 0.24],
};

const columnX = (i: number) => i - (COLUMNS - 1) / 2;
const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;

/**
 * 돌이 쉬고 있을 높이. 줄이 흐트러지지 않게 평소에는 모두 같은 높이이고, 선택했을 때만 떠오른다.
 * 지난 날과 일정 있는 날은 높이가 아니라 색, 투명도, 깃발로 구분한다.
 */
const restY = (selected: boolean) => (selected ? SELECTED_LIFT : 0);

/** 윗면은 평평하고 가장자리가 둥근 원반. 옆모습 윤곽을 한 바퀴 돌려(lathe) 만든다. */
function createStoneGeometry() {
  const corner = 0.08;
  const steps = 6;
  const outline = [new Vector2(0, 0), new Vector2(STONE_R - corner, 0)];
  for (let k = 1; k <= steps; k++) {
    const a = -Math.PI / 2 + (k / steps) * (Math.PI / 2);
    outline.push(new Vector2(STONE_R - corner + corner * Math.cos(a), corner + corner * Math.sin(a)));
  }
  outline.push(new Vector2(STONE_R, STONE_H - corner));
  for (let k = 1; k <= steps; k++) {
    const a = (k / steps) * (Math.PI / 2);
    outline.push(
      new Vector2(STONE_R - corner + corner * Math.cos(a), STONE_H - corner + corner * Math.sin(a)),
    );
  }
  outline.push(new Vector2(0, STONE_H));

  const geometry = new LatheGeometry(outline, 48);
  geometry.translate(0, -STONE_H / 2, 0);
  return geometry;
}

function createPawnGeometry() {
  // 보드게임 말의 옆모습 윤곽을 돌려서 만든다. 머리는 별도 구.
  const outline: Array<[number, number]> = [
    [0, 0],
    [0.27, 0],
    [0.28, 0.04],
    [0.22, 0.08],
    [0.17, 0.11],
    [0.12, 0.26],
    [0.095, 0.42],
    [0.15, 0.45],
    [0.15, 0.49],
    [0.085, 0.51],
    [0, 0.51],
  ];
  return new LatheGeometry(
    outline.map(([x, y]) => new Vector2(x, y)),
    40,
  );
}

function createBlobTexture() {
  // 바닥에 깔리는 부드러운 원형 그림자. 실제 그림자 계산 대신 쓰는 가벼운 방법.
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

function isDarkBackground(bg: string) {
  const c = new Color(bg);
  // Color는 선형 RGB로 저장하므로 이 식이 곧 상대 휘도다.
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b < 0.2;
}

type Phase = "wait" | "hop" | "land" | "idle";

type StoneParts = {
  lift: Group;
  material: MeshStandardMaterial;
  shadowMaterial: MeshBasicMaterial;
  flags: Group;
  flagMaterials: MeshStandardMaterial[];
  flagKey: string;
  target: number;
  initialized: boolean;
};

/**
 * 징검다리 보드 3D 장면. React 바깥의 작은 클래스로 두고,
 * 컴포넌트는 props가 바뀔 때 set*() 메서드만 호출한다.
 * 그릴 필요가 있을 때만 requestAnimationFrame을 돈다.
 */
class BoardRenderer {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-COLUMNS / 2, COLUMNS / 2, 1, -1, 0.1, 60);
  private hemisphere = new HemisphereLight("#ffffff", "#f7f7f5", 1.25);
  private geometries: Array<{ dispose: () => void }> = [];
  private stoneGeometry = createStoneGeometry();
  private pawnGeometry = createPawnGeometry();
  private headGeometry = new SphereGeometry(0.135, 32, 24);
  private poleGeometry = new CylinderGeometry(0.014, 0.014, POLE_HEIGHT, 8);
  private clothGeometry = new BoxGeometry(0.19, 0.12, 0.014);
  private stoneShadowGeometry = new PlaneGeometry(1.05, 1);
  private pawnShadowGeometry = new PlaneGeometry(0.62, 0.62);
  private blobTexture = createBlobTexture();
  private pawnMaterial = new MeshStandardMaterial({ roughness: 0.35, metalness: 0.05 });
  private pawnShadowMaterial: MeshBasicMaterial;
  private stones: StoneParts[] = [];
  private pawnRoot = new Group();
  private pawnBody = new Group();
  private pawnShadow: Mesh;

  private model: WeekBoardModel | null = null;
  private selectedIndex: number | null = null;
  private reducedMotion = false;
  private active = true;
  private isDark = false;
  private colors = {
    stone: new Color("#e0e0dd"),
    scheduled: new Color("#c9d4c9"),
    today: new Color("#ff6b4a"),
  };
  private anim = { path: [0], seg: 0, t: 0, phase: "idle" as Phase, wait: 0, clock: 0, at: 0 };

  private rafId: number | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTime: number | null = null;
  private readyNotified = false;
  private disposed = false;
  private compileStarted = false;
  private compiled = false;

  constructor(
    canvas: HTMLCanvasElement,
    private onReady: () => void,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    this.geometries.push(
      this.stoneGeometry,
      this.pawnGeometry,
      this.headGeometry,
      this.poleGeometry,
      this.clothGeometry,
      this.stoneShadowGeometry,
      this.pawnShadowGeometry,
    );

    this.camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
    this.camera.lookAt(0, LOOK_AT_Y, 0);

    const sun = new DirectionalLight("#ffffff", 1.8);
    sun.position.set(2.5, 7, 3);
    this.scene.add(this.hemisphere, sun);

    for (let i = 0; i < COLUMNS; i++) this.stones.push(this.createStone(i));

    this.pawnShadowMaterial = new MeshBasicMaterial({
      map: this.blobTexture,
      color: "#000000",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    this.pawnShadow = new Mesh(this.pawnShadowGeometry, this.pawnShadowMaterial);
    this.pawnShadow.rotation.x = -Math.PI / 2;
    const head = new Mesh(this.headGeometry, this.pawnMaterial);
    head.position.y = 0.62;
    this.pawnBody.add(new Mesh(this.pawnGeometry, this.pawnMaterial), head);
    this.pawnRoot.add(this.pawnBody);
    this.scene.add(this.pawnShadow, this.pawnRoot);

    this.resize(canvas.clientWidth, canvas.clientHeight);
  }

  private createStone(index: number): StoneParts {
    const root = new Group();
    root.position.set(columnX(index), 0, 0);

    // 물 위에 떠 있는 느낌의 바닥 그림자
    const shadowMaterial = new MeshBasicMaterial({
      map: this.blobTexture,
      color: "#000000",
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const shadow = new Mesh(this.stoneShadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.34;
    shadow.scale.set(1, STONE_DEPTH_SCALE, 1);

    const lift = new Group();
    const material = new MeshStandardMaterial({ roughness: 0.75 });
    const stone = new Mesh(this.stoneGeometry, material);
    stone.scale.set(1, 1, STONE_DEPTH_SCALE);
    const flags = new Group();
    lift.add(stone, flags);
    root.add(shadow, lift);
    this.scene.add(root);

    return {
      lift,
      material,
      shadowMaterial,
      flags,
      flagMaterials: [],
      flagKey: "",
      target: 0,
      initialized: false,
    };
  }

  /** 깃발은 일정이 바뀔 때만 다시 만든다. 마감된 일정은 깃발을 반쯤 내린다. */
  private rebuildFlags(parts: StoneParts, day: BoardDay) {
    const shown = day.events.slice(0, 3);
    const key = `${day.isPast}|${shown.map((e) => `${e.id}:${e.color}:${e.isClosed}`).join(",")}`;
    if (key === parts.flagKey) return;
    parts.flagKey = key;

    parts.flagMaterials.forEach((m) => m.dispose());
    parts.flagMaterials = [];
    parts.flags.clear();

    const xs = FLAG_X[shown.length] ?? [];
    shown.forEach((event, f) => {
      const opacity = day.isPast ? 0.45 : event.isClosed ? 0.75 : 1;
      const poleMaterial = new MeshStandardMaterial({
        color: "#d4d4d8",
        roughness: 0.5,
        transparent: opacity < 1,
        opacity,
      });
      const clothMaterial = new MeshStandardMaterial({
        color: FLAG_HEX[event.color],
        roughness: 0.6,
        transparent: opacity < 1,
        opacity,
      });
      parts.flagMaterials.push(poleMaterial, clothMaterial);

      const flag = new Group();
      flag.position.set(xs[f], STONE_H / 2, -0.18);
      const pole = new Mesh(this.poleGeometry, poleMaterial);
      pole.position.y = POLE_HEIGHT / 2;
      const cloth = new Mesh(this.clothGeometry, clothMaterial);
      cloth.position.set(0.1, event.isClosed ? POLE_HEIGHT * 0.45 : POLE_HEIGHT - 0.07, 0);
      flag.add(pole, cloth);
      parts.flags.add(flag);
    });
  }

  private applyDays() {
    const model = this.model;
    if (!model) return;
    model.days.forEach((day, i) => {
      const parts = this.stones[i];
      const selected = i === this.selectedIndex;
      const color = day.isToday
        ? this.colors.today
        : day.events.length > 0
          ? this.colors.scheduled
          : this.colors.stone;
      parts.material.color.copy(color);
      parts.material.emissive.copy(color);
      parts.material.emissiveIntensity = selected ? 0.22 : 0;
      if (parts.material.transparent !== day.isPast) {
        parts.material.transparent = day.isPast;
        parts.material.needsUpdate = true;
      }
      parts.material.opacity = day.isPast ? 0.55 : 1;
      parts.shadowMaterial.opacity = this.isDark ? 0.45 : 0.16;
      parts.target = restY(selected);
      this.rebuildFlags(parts, day);
    });
  }

  /** 오늘 칸에서 다음 모임 칸까지 한 칸씩 건너가는 경로. 동작 줄이기가 켜져 있으면 바로 도착 상태. */
  private resetPawn() {
    const model = this.model;
    if (!model) return;
    const from = Math.max(model.todayIndex, 0);
    const to = model.targetIndex ?? from;
    const path: number[] = [];
    for (let i = from; i <= to; i++) path.push(i);
    const animate = !this.reducedMotion && path.length > 1;
    this.anim = {
      path,
      seg: 0,
      t: 0,
      phase: animate ? "wait" : "idle",
      wait: START_DELAY,
      clock: 0,
      at: animate ? from : to,
    };
  }

  setModel(model: WeekBoardModel) {
    const prev = this.model;
    this.model = model;
    this.applyDays();
    const route = (m: WeekBoardModel | null) =>
      m ? `${Math.max(m.todayIndex, 0)}-${m.targetIndex ?? Math.max(m.todayIndex, 0)}` : "";
    if (route(prev) !== route(model)) this.resetPawn();
    this.startCompile();
    this.requestFrame();
  }

  /**
   * 첫 프레임 전에 셰이더를 미리 컴파일한다. 지원하는 브라우저에서는 병렬 컴파일이라
   * 메인 스레드가 멈추지 않는다. 반투명 돌 같은 변형까지 장면에 들어온 뒤(첫 setModel)에 시작한다.
   */
  private startCompile() {
    if (this.compileStarted) return;
    this.compileStarted = true;
    const done = () => {
      this.compiled = true;
      this.requestFrame();
    };
    // 병렬 컴파일 확장이 없는 환경에서는 compileAsync가 경고만 남기고 결국 동기 컴파일이 되므로,
    // 그때는 바로 첫 프레임을 그린다(셰이더는 첫 렌더에서 컴파일된다).
    if (!this.renderer.extensions.has("KHR_parallel_shader_compile")) {
      done();
      return;
    }
    this.renderer.compileAsync(this.scene, this.camera).then(done, done);
  }

  setSelected(index: number | null) {
    this.selectedIndex = index;
    this.applyDays();
    this.requestFrame();
  }

  setPalette(palette: ScenePalette) {
    this.isDark = isDarkBackground(palette.bg);
    this.colors.stone.set(palette.stone);
    this.colors.scheduled.set(palette.scheduled);
    this.colors.today.set(palette.today);
    this.pawnMaterial.color.set(palette.piece);
    this.hemisphere.groundColor.set(palette.bg);
    this.pawnShadowMaterial.opacity = this.isDark ? 0.5 : 0.3;
    this.applyDays();
    this.requestFrame();
  }

  setReducedMotion(reducedMotion: boolean) {
    if (this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    this.resetPawn();
    this.requestFrame();
  }

  setActive(active: boolean) {
    this.active = active;
    if (active) {
      this.requestFrame();
    } else {
      this.cancelFrames();
    }
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    // 화면 가로에 정확히 7칸이 들어가게 해서, 위에 겹친 HTML 요일 버튼과 정렬한다.
    const halfHeight = ((COLUMNS / 2) * height) / width;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.requestFrame();
  }

  private stoneTop(index: number) {
    return this.stones[index].lift.position.y + STONE_H / 2;
  }

  /** 돌 높이를 목표값으로 부드럽게 옮긴다. 아직 움직이는 돌이 있으면 true. */
  private updateStones(dt: number) {
    let moving = false;
    for (const parts of this.stones) {
      const y = parts.lift.position.y;
      if (this.reducedMotion || !parts.initialized) {
        parts.lift.position.y = parts.target;
        parts.initialized = true;
        continue;
      }
      parts.lift.position.y = MathUtils.damp(y, parts.target, 14, dt);
      if (Math.abs(parts.lift.position.y - parts.target) > 0.0005) moving = true;
    }
    return moving;
  }

  /** 말의 위치를 갱신한다. 이동이 끝나 제자리에 있으면 false. */
  private updatePawn(dt: number) {
    const a = this.anim;
    a.clock += dt;

    let x = columnX(a.at);
    let base = this.stoneTop(a.at);
    let lift = 0;
    let sy = 1;
    let sxz = 1;

    if (a.phase === "wait") {
      a.wait -= dt;
      if (a.wait <= 0) {
        a.phase = "hop";
        a.t = 0;
      }
    } else if (a.phase === "hop") {
      a.t = Math.min(a.t + dt / HOP_DURATION, 1);
      const i0 = a.path[a.seg];
      const i1 = a.path[a.seg + 1];
      const e = easeInOutSine(a.t);
      x = MathUtils.lerp(columnX(i0), columnX(i1), e);
      base = MathUtils.lerp(this.stoneTop(i0), this.stoneTop(i1), e);
      lift = HOP_HEIGHT * 4 * a.t * (1 - a.t);
      const stretch = Math.sin(Math.PI * a.t);
      sy = 1 + 0.08 * stretch;
      sxz = 1 - 0.04 * stretch;
      if (a.t >= 1) {
        a.at = i1;
        a.seg += 1;
        a.phase = "land";
        a.t = 0;
      }
    } else if (a.phase === "land") {
      a.t = Math.min(a.t + dt / LAND_DURATION, 1);
      const squash = Math.sin(Math.PI * a.t);
      sy = 1 - 0.16 * squash;
      sxz = 1 + 0.1 * squash;
      if (a.t >= 1) {
        a.phase = a.seg >= a.path.length - 1 ? "idle" : "hop";
        a.t = 0;
        a.clock = 0;
      }
    } else if (!this.reducedMotion) {
      lift = (IDLE_BOB * (1 - Math.cos((a.clock / 1.6) * Math.PI * 2))) / 2;
    }

    this.pawnRoot.position.set(x, base + lift, PAWN_Z);
    this.pawnBody.scale.set(sxz * PAWN_SCALE, sy * PAWN_SCALE, sxz * PAWN_SCALE);

    // 말이 높이 뜰수록 그림자는 작고 옅어진다.
    const k = Math.min(lift / HOP_HEIGHT, 1);
    this.pawnShadow.position.set(x, base + 0.004, PAWN_Z);
    this.pawnShadow.scale.setScalar(1 - 0.45 * k);
    this.pawnShadowMaterial.opacity = (this.isDark ? 0.5 : 0.3) * (1 - 0.5 * k);

    return a.phase !== "idle";
  }

  private requestFrame = () => {
    if (this.disposed || !this.compiled || this.rafId !== null || !this.model) return;
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.rafId = requestAnimationFrame(this.frame);
  };

  private cancelFrames() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    this.rafId = null;
    this.idleTimer = null;
    // 멈춘 동안 흐른 시간이 다음 프레임에 한꺼번에 반영되지 않게 한다.
    this.lastTime = null;
  }

  private frame = (time: number) => {
    this.rafId = null;
    // 탭 전환 등으로 프레임이 크게 밀려도 말이 순간이동하지 않게 한 프레임 시간을 제한한다.
    const dt = this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    const stonesMoving = this.updateStones(dt);
    const pawnMoving = this.updatePawn(dt);
    this.renderer.render(this.scene, this.camera);

    if (!this.readyNotified) {
      this.readyNotified = true;
      this.onReady();
    }

    if (!this.active) {
      this.lastTime = null;
    } else if (stonesMoving || pawnMoving) {
      this.requestFrame();
    } else if (!this.reducedMotion) {
      this.idleTimer = setTimeout(() => {
        this.idleTimer = null;
        this.requestFrame();
      }, IDLE_FRAME_MS);
    } else {
      this.lastTime = null;
    }
  };

  dispose() {
    this.disposed = true;
    this.cancelFrames();
    this.geometries.forEach((g) => g.dispose());
    this.blobTexture.dispose();
    this.pawnMaterial.dispose();
    this.pawnShadowMaterial.dispose();
    for (const parts of this.stones) {
      parts.material.dispose();
      parts.shadowMaterial.dispose();
      parts.flagMaterials.forEach((m) => m.dispose());
    }
    // forceContextLoss()는 쓰지 않는다. 개발 모드 StrictMode는 같은 캔버스로 다시 마운트하는데,
    // 그때 이미 잃어버린 컨텍스트를 받게 된다. 컨텍스트는 캔버스가 사라지면 브라우저가 거둔다.
    this.renderer.dispose();
  }
}

export default function WeekBoardScene({
  model,
  selectedIndex,
  active,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<BoardRenderer | null>(null);
  const onReadyRef = useRef(onReady);

  const paletteKey = useSyncExternalStore(
    subscribeTheme,
    getPaletteSnapshot,
    getPaletteServerSnapshot,
  );
  const palette = useMemo<ScenePalette>(() => {
    const [stone, scheduled, today, piece, bg] = paletteKey.split("|");
    return { stone, scheduled, today, piece, bg };
  }, [paletteKey]);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const board = new BoardRenderer(canvas, () => onReadyRef.current());
    boardRef.current = board;
    const observer = new ResizeObserver(([entry]) => {
      board.resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      board.dispose();
      boardRef.current = null;
    };
  }, []);

  // 순서가 중요하다: 색을 먼저 정해야 일정 상태를 반영할 때 올바른 색이 들어간다.
  useEffect(() => {
    boardRef.current?.setPalette(palette);
  }, [palette]);

  useEffect(() => {
    boardRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    boardRef.current?.setModel(model);
  }, [model]);

  useEffect(() => {
    boardRef.current?.setSelected(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    boardRef.current?.setActive(active);
  }, [active]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
