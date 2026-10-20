import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";

const supabase = createClient();

export const weekBoardKeys = {
  events: (groupIds: string[], fromISO: string) =>
    ["week-board", "events", groupIds, fromISO] as const,
  participantCounts: (eventIds: string[]) =>
    ["week-board", "participant-counts", eventIds] as const,
};

// 내 방들의 이번 주 월요일 이후 일정. 이번 주가 비었을 때 "다음 모임"을 알려주려고
// 이번 주 끝에서 자르지 않고 시작 시간순으로 가져온다.
const fetchWeekEvents = async (
  groupIds: string[],
  fromISO: string,
): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("group_id", groupIds)
    .gte("start_time", fromISO)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })
    .limit(50)
    .returns<Event[]>();

  if (error) throw error;
  return data ?? [];
};

const fetchParticipantCounts = async (
  eventIds: string[],
): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from("participants")
    .select("event_id")
    .in("event_id", eventIds)
    .returns<{ event_id: string }[]>();

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }
  return counts;
};

export const useWeekBoardEvents = (groupIds: string[], weekStart: Date) => {
  const fromISO = weekStart.toISOString();
  return useQuery({
    queryKey: weekBoardKeys.events(groupIds, fromISO),
    queryFn: () => fetchWeekEvents(groupIds, fromISO),
    enabled: groupIds.length > 0,
    // 그룹 페이지에서 일정을 만들고 홈으로 돌아오면 바로 반영되도록 항상 새로 불러온다.
    staleTime: 0,
  });
};

export const useParticipantCounts = (eventIds: string[]) => {
  return useQuery({
    queryKey: weekBoardKeys.participantCounts(eventIds),
    queryFn: () => fetchParticipantCounts(eventIds),
    enabled: eventIds.length > 0,
    staleTime: 0,
  });
};
