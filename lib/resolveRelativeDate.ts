import {
  addDays,
  addWeeks,
  format,
  nextDay,
  startOfWeek,
  type Day,
} from "date-fns";

const WEEKDAY_MAP: Record<string, Day> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

/**
 * LLM이 뽑은 상대 날짜 표현("다음주 금요일", "내일" 등)을 date-fns로 다시 계산해
 * LLM이 반환한 절대 날짜(YYYY-MM-DD)와 대조 검증한다.
 * 알려진 패턴이면 date-fns 계산 결과를 신뢰하고, 모르는 표현이면 null(검증 불가)을 반환한다.
 */
export function resolveRelativeDate(
  expression: string,
  baseDate: Date,
): Date | null {
  const text = expression.trim();

  if (text === "오늘") return baseDate;
  if (text === "내일") return addDays(baseDate, 1);
  if (text === "모레") return addDays(baseDate, 2);
  if (text === "글피") return addDays(baseDate, 3);

  // "이번주 금요일" / "이번 주 금요일"
  const thisWeekMatch = text.match(/^이번\s?주\s?([일월화수목금토])요일$/);
  if (thisWeekMatch) {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const targetDay = WEEKDAY_MAP[thisWeekMatch[1]];
    const daysFromMonday = (targetDay - 1 + 7) % 7;
    return addDays(weekStart, daysFromMonday);
  }

  // "다음주 금요일" / "다음 주 금요일"
  const nextWeekMatch = text.match(/^다음\s?주\s?([일월화수목금토])요일$/);
  if (nextWeekMatch) {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const targetDay = WEEKDAY_MAP[nextWeekMatch[1]];
    const daysFromMonday = (targetDay - 1 + 7) % 7;
    return addWeeks(addDays(weekStart, daysFromMonday), 1);
  }

  // "이번주 금요일" 다음처럼 그냥 "금요일" (돌아오는 요일)
  const bareWeekdayMatch = text.match(/^([일월화수목금토])요일$/);
  if (bareWeekdayMatch) {
    return nextDay(baseDate, WEEKDAY_MAP[bareWeekdayMatch[1]]);
  }

  return null;
}

export function formatDateForCompare(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
