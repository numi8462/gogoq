export type Point = { x: number; y: number };

/**
 * 말이 포물선을 그리며 a에서 b로 뛰는 키프레임. 출발할 때 웅크리고 착지할 때 살짝 찌그러진다.
 * 캘린더 말과 홈 START 보드 말이 같은 동작을 쓴다.
 */
export function hopKeyframes(a: Point, b: Point, height: number): Keyframe[] {
  const at = (t: number, sx: number, sy: number, offset: number): Keyframe => {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t - 4 * height * t * (1 - t);
    return { transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`, offset };
  };
  return [
    at(0, 1, 1, 0),
    at(0, 1.12, 0.86, 0.12),
    at(0.25, 0.96, 1.06, 0.3),
    at(0.5, 0.94, 1.08, 0.5),
    at(0.75, 0.96, 1.06, 0.7),
    at(1, 1.14, 0.84, 0.88),
    at(1, 1, 1, 1),
  ];
}
