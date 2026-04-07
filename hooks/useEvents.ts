import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types";

const supabase = createClient();

// 쿼리 키 상수로 관리
export const eventKeys = {
  all: (groupId: string) => ["events", groupId] as const,
};

// 이벤트 목록 fetch
const fetchEvents = async (groupId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("group_id", groupId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
};

// 이벤트 생성
const createEvent = async (payload: Omit<Event, "id" | "status">) => {
  const { data, error } = await supabase
    .from("events")
    .insert({ ...payload, status: "open" })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 이벤트 수정
const updateEvent = async ({
  id,
  ...payload
}: Partial<Omit<Event, "id">> & { id: string }) => {
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 이벤트 삭제
const deleteEvent = async (id: string) => {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
};

// hooks
export const useEvents = (groupId: string) => {
  return useQuery({
    queryKey: eventKeys.all(groupId),
    queryFn: () => fetchEvents(groupId),
    enabled: !!groupId,
  });
};

export const useCreateEvent = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      // 이벤트 생성 후 캐시 무효화 → 자동 리페치
      queryClient.invalidateQueries({ queryKey: eventKeys.all(groupId) });
    },
  });
};

export const useUpdateEvent = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all(groupId) });
    },
  });
};

export const useDeleteEvent = (groupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all(groupId) });
    },
  });
};
