import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { eventKeys } from "./useEvents";
import { participantKeys } from "./useParticipants";

export const useRealtimeSync = (groupId: string) => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group:${groupId}`)

      // 이벤트 상태 변경 (open → closed 등)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: eventKeys.all(groupId),
          });
        },
      )

      // 참여자 변경 (참여 / 취소)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
        },
        (payload) => {
          // payload에서 event_id 추출
          const eventId =
            (payload.new as { event_id?: string })?.event_id ??
            (payload.old as { event_id?: string })?.event_id;

          if (!eventId) return;

          queryClient.invalidateQueries({
            queryKey: participantKeys.all(eventId),
          });
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient, supabase]);
};
