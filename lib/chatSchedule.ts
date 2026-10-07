import { format, isValid, parseISO } from "date-fns";
import { EVENT_COLORS } from "@/lib/utils";
import {
  formatDateForCompare,
  resolveRelativeDate,
} from "@/lib/resolveRelativeDate";

/**
 * app/api/chat/route.ts에서 Claude에 "현재 그룹 일정 목록"으로 넘기고,
 * 수정/삭제 대상(event_id) 매칭에도 쓰는 이벤트 요약 형태.
 */
export type EventSummary = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  color?: string;
  status: string;
};

/**
 * 챗봇 확인 카드(ScheduleConfirmCard)와 Supabase insert/update payload가 공유하는
 * 필드 형태. date는 YYYY-MM-DD, start_time/end_time은 HH:mm.
 */
export type ScheduleDraftFields = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  color: (typeof EVENT_COLORS)[number];
};

/**
 * DB에 저장된 이벤트 레코드(start_time/end_time이 ISO datetime)를
 * 챗봇 draft 필드 형태로 변환한다.
 * - update_schedule/delete_schedule 대상 이벤트를 확인 카드에 보여줄 때
 * - update_schedule에서 사용자가 언급하지 않은 필드의 기존 값을 채울 때
 * 두 경우 모두 이 함수를 거친다.
 */
export function eventToFields(event: EventSummary): ScheduleDraftFields {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  return {
    title: event.title,
    date: format(start, "yyyy-MM-dd"),
    start_time: format(start, "HH:mm"),
    end_time: format(end, "HH:mm"),
    max_participants: event.max_participants,
    color: (event.color ?? "blue") as (typeof EVENT_COLORS)[number],
  };
}

export type DateValidationResult = { date: string; corrected: boolean };

/**
 * Claude의 tool calling 결과(date, relative_expression)를 검증한다.
 * AI가 뽑은 날짜를 그대로 신뢰하지 않고, "다음주 금요일" 같은 상대 표현이 있으면
 * date-fns(resolveRelativeDate)로 다시 계산해 대조한다.
 *
 * - date 자체가 유효한 날짜 문자열이 아니면 null(검증 실패, 호출 쪽에서 되묻기 처리)
 * - relative_expression이 date-fns가 아는 패턴이고 Claude의 date와 다르면,
 *   date-fns 계산 결과로 덮어쓰고 corrected: true
 * - relative_expression이 없거나 date-fns가 모르는 표현이면 Claude의 date를 그대로 신뢰
 *   (알려진 패턴이 아니라고 해서 틀렸다고 단정할 수 없으므로 null이 아니라 corrected: false)
 */
export function validateDate(
  date: string,
  relativeExpression: string | undefined,
  nowISO: string,
): DateValidationResult | null {
  const parsed = parseISO(date);
  if (!isValid(parsed)) return null;

  let result = date;
  let corrected = false;
  if (relativeExpression?.trim()) {
    const resolved = resolveRelativeDate(relativeExpression, new Date(nowISO));
    if (resolved) {
      const resolvedStr = formatDateForCompare(resolved);
      if (resolvedStr !== date) {
        result = resolvedStr;
        corrected = true;
      }
    }
  }
  return { date: result, corrected };
}
