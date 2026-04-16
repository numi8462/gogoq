import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Participant } from "@/types";

const supabase = createClient();

export const participantKeys = {
  all: (eventId: string) => ["participants", eventId] as const,
};

const fetchParticipants = async (eventId: string): Promise<Participant[]> => {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
};

const joinEvent = async ({
  eventId,
  nickname,
}: {
  eventId: string;
  nickname: string;
}) => {
  const { data, error } = await supabase.rpc("join_event", {
    p_event_id: eventId,
    p_nickname: nickname,
  });

  if (error) throw error;

  // join_event 함수가 { error: "..." } 반환하는 경우 처리
  if (data?.error) throw new Error(data.error);

  return data;
};

const leaveEvent = async ({
  eventId,
  nickname,
}: {
  eventId: string;
  nickname: string;
}) => {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("event_id", eventId)
    .eq("nickname", nickname);

  if (error) throw error;
};

export const useParticipants = (eventId: string) => {
  return useQuery({
    queryKey: participantKeys.all(eventId),
    queryFn: () => fetchParticipants(eventId),
    enabled: !!eventId,
  });
};

export const useJoinEvent = (groupId: string, eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: participantKeys.all(eventId),
      });
      // 이벤트 status(마감 여부)도 갱신
      queryClient.invalidateQueries({
        queryKey: ["events", groupId],
      });
    },
  });
};

export const useLeaveEvent = (groupId: string, eventId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: participantKeys.all(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: ["events", groupId],
      });
    },
  });
};
