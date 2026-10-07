import { describe, expect, it } from "vitest";
import { formatDateForCompare, resolveRelativeDate } from "./resolveRelativeDate";

// 2024-01-10은 수요일로 고정 (요일 기준 상대 표현을 검증하기 위한 기준일).
const WED_JAN_10 = new Date("2024-01-10T12:00:00");

describe("resolveRelativeDate", () => {
  it("오늘/내일/모레/글피를 기준일로부터의 일수로 계산한다", () => {
    expect(formatDateForCompare(resolveRelativeDate("오늘", WED_JAN_10)!)).toBe(
      "2024-01-10",
    );
    expect(formatDateForCompare(resolveRelativeDate("내일", WED_JAN_10)!)).toBe(
      "2024-01-11",
    );
    expect(formatDateForCompare(resolveRelativeDate("모레", WED_JAN_10)!)).toBe(
      "2024-01-12",
    );
    expect(formatDateForCompare(resolveRelativeDate("글피", WED_JAN_10)!)).toBe(
      "2024-01-13",
    );
  });

  it("'이번주 금요일'은 기준일(수요일)이 속한 주의 금요일로 계산한다", () => {
    // 기준일(수요일) < 금요일이므로 같은 주 내의 다가오는 금요일이어야 함.
    const resolved = resolveRelativeDate("이번주 금요일", WED_JAN_10);
    expect(formatDateForCompare(resolved!)).toBe("2024-01-12");
  });

  it("'이번 주 금요일'처럼 띄어쓰기가 있어도 동일하게 계산한다", () => {
    const resolved = resolveRelativeDate("이번 주 금요일", WED_JAN_10);
    expect(formatDateForCompare(resolved!)).toBe("2024-01-12");
  });

  it("'다음주 금요일'은 이번주 금요일보다 정확히 7일 뒤다", () => {
    const resolved = resolveRelativeDate("다음주 금요일", WED_JAN_10);
    expect(formatDateForCompare(resolved!)).toBe("2024-01-19");
  });

  it("'금요일'만 단독으로 쓰면 돌아오는 금요일(오늘 제외)로 계산한다", () => {
    const resolved = resolveRelativeDate("금요일", WED_JAN_10);
    expect(formatDateForCompare(resolved!)).toBe("2024-01-12");
  });

  it("기준일이 금요일 당일일 때 '금요일'은 다음주 금요일을 가리킨다 (date-fns nextDay는 당일을 포함하지 않음)", () => {
    const FRI_JAN_12 = new Date("2024-01-12T12:00:00");
    const resolved = resolveRelativeDate("금요일", FRI_JAN_12);
    expect(formatDateForCompare(resolved!)).toBe("2024-01-19");
  });

  it("알려지지 않은 표현은 null을 반환해 검증 불가로 처리한다", () => {
    expect(resolveRelativeDate("다다음주 금요일", WED_JAN_10)).toBeNull();
    expect(resolveRelativeDate("이번달 말", WED_JAN_10)).toBeNull();
    expect(resolveRelativeDate("", WED_JAN_10)).toBeNull();
  });
});
