import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/useToastStore";
import { eventKeys } from "./useEvents";
import { participantKeys } from "./useParticipants";

export const useRealtimeSync = (groupId: string) => {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const showToast = useToastStore((s) => s.showToast);
  // 연결이 끊긴 동안 재시도마다 토스트가 반복해서 뜨지 않도록 방지
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (!groupId) return;
    hasNotifiedRef.current = false;

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
          // filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          console.log("participants change:", payload);

          // payload에서 event_id 추출
          const eventId =
            (payload.new as { event_id?: string })?.event_id ??
            (payload.old as { event_id?: string })?.event_id;

          queryClient.invalidateQueries({
            queryKey: ["participants"],
            refetchType: "all",
          });

          queryClient.invalidateQueries({
            queryKey: ["events", groupId],
          });

          if (eventId) {
            queryClient.invalidateQueries({
              queryKey: participantKeys.all(eventId),
            });
          }
        },
      )

      // 지금까지는 구독 상태를 전혀 보지 않아서, 연결이 끊기거나 실패해도
      // 사용자는 아무 표시 없이 그냥 "일정이 실시간으로 안 반영되는" 상태로
      // 남아있었다. 에러/타임아웃일 때만 한 번 토스트로 알려준다.
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          hasNotifiedRef.current = false;
          return;
        }
        if (
          (status === "CHANNEL_ERROR" || status === "TIMED_OUT") &&
          !hasNotifiedRef.current
        ) {
          hasNotifiedRef.current = true;
          showToast(
            "실시간 동기화 연결에 문제가 생겼어요. 새로고침 해주세요.",
            "error",
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient, supabase, showToast]);
};
