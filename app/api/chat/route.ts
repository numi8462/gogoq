import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { format, isValid, parseISO } from "date-fns";
import { EVENT_COLORS } from "@/lib/utils";
import { formatDateForCompare, resolveRelativeDate } from "@/lib/resolveRelativeDate";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type EventSummary = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  color?: string;
  status: string;
};

type ScheduleFields = {
  title: string;
  date: string;
  relative_expression: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  color: (typeof EVENT_COLORS)[number];
};

const scheduleFieldProps = {
  title: {
    type: "string" as const,
    description: "일정 제목 (예: 롤, 발로란트, 보드게임 모임)",
  },
  date: {
    type: "string" as const,
    description: "YYYY-MM-DD 형식의 절대 날짜 (현재 시각 기준으로 계산)",
  },
  relative_expression: {
    type: "string" as const,
    description:
      "사용자가 사용한 상대 날짜 표현 원문 (예: '다음주 금요일', '내일'). 상대 표현이 없었다면 빈 문자열.",
  },
  start_time: { type: "string" as const, description: "HH:mm 24시간제 시작 시간" },
  end_time: {
    type: "string" as const,
    description: "HH:mm 24시간제 종료 시간. 사용자가 말하지 않았다면 시작 시간 + 2시간으로 추정.",
  },
  max_participants: {
    type: "integer" as const,
    description: "최대 참여 인원. 언급이 없으면 5.",
  },
  color: {
    type: "string" as const,
    enum: [...EVENT_COLORS],
    description: "일정 색상 태그. 언급이 없으면 blue.",
  },
};

const createScheduleTool: Anthropic.Tool = {
  name: "create_schedule",
  description:
    "사용자가 말한 게임/모임 일정 정보(제목, 날짜, 시작 시간)가 충분히 모였을 때만 호출해 구조화된 일정 초안을 만든다. 정보가 부족하면 호출하지 말고 무엇이 더 필요한지 되물어라.",
  input_schema: {
    type: "object",
    properties: scheduleFieldProps,
    required: [
      "title",
      "date",
      "relative_expression",
      "start_time",
      "end_time",
      "max_participants",
      "color",
    ],
    additionalProperties: false,
  },
  strict: true,
};

const updateScheduleTool: Anthropic.Tool = {
  name: "update_schedule",
  description:
    "아래 제공된 '현재 일정 목록'에 있는 기존 일정을 수정할 때 호출한다. event_id는 반드시 그 목록에 있는 id를 그대로 사용해라. 바뀌는 필드만 채우고, 사용자가 언급하지 않은 필드는 아예 넣지 마라(기존 값 유지).",
  input_schema: {
    type: "object",
    properties: {
      event_id: {
        type: "string",
        description: "수정할 일정의 id (현재 일정 목록에서 그대로 가져올 것)",
      },
      ...scheduleFieldProps,
    },
    required: ["event_id"],
    additionalProperties: false,
  },
  strict: true,
};

const deleteScheduleTool: Anthropic.Tool = {
  name: "delete_schedule",
  description:
    "아래 제공된 '현재 일정 목록'에 있는 기존 일정을 삭제(취소)할 때 호출한다. event_id는 반드시 그 목록에 있는 id를 그대로 사용해라.",
  input_schema: {
    type: "object",
    properties: {
      event_id: {
        type: "string",
        description: "삭제할 일정의 id (현재 일정 목록에서 그대로 가져올 것)",
      },
    },
    required: ["event_id"],
    additionalProperties: false,
  },
  strict: true,
};

function eventToFields(event: EventSummary) {
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

function buildEventListLabel(events: EventSummary[]) {
  if (events.length === 0) return "현재 그룹에 등록된 일정이 없다.";
  return events
    .map((e) => {
      const f = eventToFields(e);
      return `- id: ${e.id} | ${f.title} | ${f.date} ${f.start_time}~${f.end_time} | 최대 ${f.max_participants}명 | 상태: ${e.status}`;
    })
    .join("\n");
}

function buildSystemPrompt(
  nowISO: string,
  timeZone: string,
  events: EventSummary[],
) {
  const now = new Date(nowISO);
  const weekday = WEEKDAY_KO[now.getDay()];
  const nowLabel = `${nowISO.slice(0, 16).replace("T", " ")} (${weekday}요일)`;

  return `당신은 gogoQ(친구들끼리 게임/모임 일정을 잡는 서비스)의 일정 도우미입니다.

현재 시각: ${nowLabel}, 시간대: ${timeZone}.

현재 그룹의 일정 목록:
${buildEventListLabel(events)}

이 서비스에서 새 일정 등록에 실제로 꼭 필요한 정보는 "제목, 날짜, 시작 시간" 3가지뿐이다. 그 외 필드는 사용자가 말하지 않으면 아래 기본값을 네가 알아서 채워 넣어야 하며, 이 필드들 때문에 절대 되묻지 마라:
- end_time: 사용자가 말하지 않았다면 start_time + 2시간
- max_participants: 사용자가 말하지 않았다면 5
- color: 사용자가 말하지 않았다면 blue

규칙:
- 사용자가 새 일정을 만들어달라고 하면 create_schedule을 호출해라. 제목/날짜/시작 시간 중 하나라도 빠졌으면 호출하지 말고 부족한 부분만 되물어라.
- 사용자가 기존 일정을 수정(시간 변경, 인원 변경 등)해달라고 하면 update_schedule을 호출해라. 위 일정 목록에서 사용자가 말한 일정(제목/날짜로 유추)을 찾아 그 id를 event_id에 넣어라. 일치하는 일정이 없거나 여러 개라 애매하면 호출하지 말고 어떤 일정인지 되물어라.
- 사용자가 기존 일정을 삭제/취소해달라고 하면 delete_schedule을 호출해라. 마찬가지로 위 목록에서 알맞은 id를 찾아라. 애매하면 되물어라.
- 위 세 도구 외의 방법(텍스트로 "수정했어요", "삭제했어요" 등)으로 실제 처리가 끝난 것처럼 말하지 마라 — 실제 반영은 사용자가 확인 카드에서 승인해야만 이루어진다.
- 날짜는 위 현재 시각을 기준으로 계산해라. "다음주 금요일", "내일" 같은 상대적 표현을 사용했다면 relative_expression 필드에 그 원문을 그대로 채워라. 상대 표현이 없었다면 빈 문자열로 두거나(생성 시) 필드 자체를 생략해라(수정 시).
- 절대 자유 텍스트로 날짜/시간을 지어내지 말고, 항상 도구의 필드 형식(YYYY-MM-DD, HH:mm)을 지켜라.`;
}

function validateDate(
  date: string,
  relativeExpression: string | undefined,
  nowISO: string,
): { date: string; corrected: boolean } | null {
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

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되어 있지 않아요." },
      { status: 500 },
    );
  }

  const body = await req.json();
  const history: ChatTurn[] = Array.isArray(body.history) ? body.history : [];
  const nowISO: string = body.nowISO ?? new Date().toISOString();
  const timeZone: string = body.timeZone ?? "Asia/Seoul";
  const events: EventSummary[] = Array.isArray(body.events) ? body.events : [];

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "마지막 메시지는 사용자 메시지여야 해요." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: buildSystemPrompt(nowISO, timeZone, events),
      tools: [createScheduleTool, updateScheduleTool, deleteScheduleTool],
      tool_choice: { type: "auto" },
      messages: history.map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json({
      type: "message",
      text: "이 요청은 처리할 수 없어요. 다른 방식으로 말해줄래요?",
    });
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  const cantUnderstand = () =>
    NextResponse.json({
      type: "message",
      text: "날짜를 이해하지 못했어요. 정확한 날짜나 요일로 다시 말해줄래요?",
    });

  if (toolUse?.name === "create_schedule") {
    const input = toolUse.input as ScheduleFields;
    const validated = validateDate(input.date, input.relative_expression, nowISO);
    if (!validated) return cantUnderstand();

    return NextResponse.json({
      type: "draft",
      action: "create",
      draft: {
        title: input.title,
        date: validated.date,
        start_time: input.start_time,
        end_time: input.end_time,
        max_participants: input.max_participants,
        color: input.color,
      },
      dateCorrected: validated.corrected,
    });
  }

  if (toolUse?.name === "update_schedule") {
    const input = toolUse.input as Partial<ScheduleFields> & { event_id: string };
    const original = events.find((e) => e.id === input.event_id);
    if (!original) {
      return NextResponse.json({
        type: "message",
        text: "어떤 일정을 말하는 건지 못 찾았어요. 일정 제목이나 날짜를 조금 더 알려줄래요?",
      });
    }

    const originalFields = eventToFields(original);
    let date = input.date ?? originalFields.date;
    let dateCorrected = false;

    if (input.date) {
      const validated = validateDate(input.date, input.relative_expression, nowISO);
      if (!validated) return cantUnderstand();
      date = validated.date;
      dateCorrected = validated.corrected;
    }

    return NextResponse.json({
      type: "draft",
      action: "update",
      eventId: original.id,
      draft: {
        title: input.title ?? originalFields.title,
        date,
        start_time: input.start_time ?? originalFields.start_time,
        end_time: input.end_time ?? originalFields.end_time,
        max_participants: input.max_participants ?? originalFields.max_participants,
        color: input.color ?? originalFields.color,
      },
      dateCorrected,
    });
  }

  if (toolUse?.name === "delete_schedule") {
    const input = toolUse.input as { event_id: string };
    const original = events.find((e) => e.id === input.event_id);
    if (!original) {
      return NextResponse.json({
        type: "message",
        text: "어떤 일정을 말하는 건지 못 찾았어요. 일정 제목이나 날짜를 조금 더 알려줄래요?",
      });
    }

    return NextResponse.json({
      type: "draft",
      action: "delete",
      eventId: original.id,
      draft: eventToFields(original),
    });
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );

  return NextResponse.json({
    type: "message",
    text: textBlock?.text ?? "무슨 일정인지 조금만 더 알려줄래요?",
  });
}
