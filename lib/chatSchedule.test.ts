import { describe, expect, it } from "vitest";
import { eventToFields, validateDate, type EventSummary } from "./chatSchedule";

const NOW_ISO = "2024-01-10T12:00:00"; // 수요일 기준

describe("eventToFields", () => {
  it("DB 이벤트 레코드를 확인 카드/폼이 쓰는 날짜·시간 필드로 변환한다", () => {
    const event: EventSummary = {
      id: "evt-1",
      title: "롤 내전",
      start_time: "2024-01-12T20:00:00",
      end_time: "2024-01-12T22:00:00",
      max_participants: 5,
      color: "blue",
      status: "open",
    };

    expect(eventToFields(event)).toEqual({
      title: "롤 내전",
      date: "2024-01-12",
      start_time: "20:00",
      end_time: "22:00",
      max_participants: 5,
      color: "blue",
    });
  });

  it("color가 비어있으면 기본값 blue로 채운다", () => {
    const event: EventSummary = {
      id: "evt-2",
      title: "보드게임",
      start_time: "2024-01-12T20:00:00",
      end_time: "2024-01-12T22:00:00",
      max_participants: 4,
      status: "open",
    };

    expect(eventToFields(event).color).toBe("blue");
  });
});

describe("validateDate (AI tool calling 결과 검증)", () => {
  it("상대 날짜 표현이 없으면 Claude가 뽑은 날짜를 그대로 신뢰한다", () => {
    const result = validateDate("2024-01-12", "", NOW_ISO);
    expect(result).toEqual({ date: "2024-01-12", corrected: false });
  });

  it("상대 날짜 표현이 Claude의 날짜와 일치하면 보정하지 않는다", () => {
    // "내일" 기준 2024-01-10 -> 2024-01-11, Claude도 같은 날짜를 반환한 경우
    const result = validateDate("2024-01-11", "내일", NOW_ISO);
    expect(result).toEqual({ date: "2024-01-11", corrected: false });
  });

  it("상대 날짜 표현과 Claude의 날짜가 다르면 date-fns 계산 결과로 보정한다", () => {
    // Claude가 "내일"이라면서 엉뚱한 날짜(2024-01-15)를 반환한 경우
    const result = validateDate("2024-01-15", "내일", NOW_ISO);
    expect(result).toEqual({ date: "2024-01-11", corrected: true });
  });

  it("date-fns가 모르는 상대 표현이면 보정하지 않고 Claude의 날짜를 신뢰한다", () => {
    const result = validateDate("2024-12-25", "크리스마스", NOW_ISO);
    expect(result).toEqual({ date: "2024-12-25", corrected: false });
  });

  it("relative_expression이 없을 때(수정 시 필드 생략)도 정상 동작한다", () => {
    const result = validateDate("2024-01-20", undefined, NOW_ISO);
    expect(result).toEqual({ date: "2024-01-20", corrected: false });
  });

  it("date 자체가 유효하지 않으면 null을 반환해 호출 쪽이 되묻게 한다", () => {
    expect(validateDate("다음주", undefined, NOW_ISO)).toBeNull();
    expect(validateDate("2024-13-99", undefined, NOW_ISO)).toBeNull();
  });
});
