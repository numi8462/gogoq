"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { Send, X } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "@/hooks/useEvents";
import { Event } from "@/types";
import ScheduleConfirmCard from "./ScheduleConfirmCard";
import { ChatMessage, ScheduleAction, ScheduleAttrs } from "./types";

interface Props {
  groupId: string;
  events: Event[];
  onClose: () => void;
}

type ApiTurn = { role: "user" | "assistant"; content: string };

type ChatApiResponse =
  | { type: "message"; text: string }
  | {
      type: "draft";
      action: ScheduleAction;
      eventId?: string;
      draft: ScheduleAttrs;
      dateCorrected: boolean;
    }
  | { error: string };

export default function ChatPanel({ groupId, events, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: '안녕하세요! "다음주 금요일 저녁 8시에 축구하자"처럼 자유롭게 말해주면 일정 초안을 만들어드려요. 기존 일정 수정/삭제도 말씀해주시면 처리해드려요.',
    },
  ]);
  const [apiHistory, setApiHistory] = useState<ApiTurn[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { mutate: createEvent } = useCreateEvent(groupId);
  const { mutate: updateEvent } = useUpdateEvent(groupId);
  const { mutate: deleteEvent } = useDeleteEvent(groupId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = { id: nanoid(), role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    const nextHistory: ApiTurn[] = [
      ...apiHistory,
      { role: "user", content: text },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: nextHistory,
          nowISO: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            start_time: e.start_time,
            end_time: e.end_time,
            max_participants: e.max_participants,
            color: e.color,
            status: e.status,
          })),
        }),
      });
      const data: ChatApiResponse = await res.json();

      if ("error" in data) {
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            role: "assistant",
            text: "메시지를 처리하지 못했어요. 잠시 후 다시 시도해줄래요?",
          },
        ]);
        return;
      }

      if (data.type === "draft") {
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            role: "assistant",
            action: data.action,
            eventId: data.eventId,
            attrs: data.draft,
            dateCorrected: data.dateCorrected,
            status: "pending",
          },
        ]);
        setApiHistory(nextHistory);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: nanoid(), role: "assistant", text: data.text },
        ]);
        setApiHistory([
          ...nextHistory,
          { role: "assistant", content: data.text },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          text: "네트워크 오류가 발생했어요. 다시 시도해줄래요?",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const markMessage = (
    messageId: string,
    patch: { status?: "pending" | "confirmed" | "cancelled"; error?: string },
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !("action" in m)) return m;
        return { ...m, ...patch };
      }),
    );
  };

  const handleConfirm = (
    messageId: string,
    action: ScheduleAction,
    attrs: ScheduleAttrs,
    eventId?: string,
  ) => {
    setConfirmingId(messageId);

    const onSuccess = () => {
      markMessage(messageId, { status: "confirmed" });
      setConfirmingId(null);
    };
    const onError = (err: Error) => {
      markMessage(messageId, { error: err.message });
      setConfirmingId(null);
    };

    if (action === "create") {
      createEvent(
        {
          group_id: groupId,
          title: attrs.title,
          color: attrs.color,
          start_time: new Date(`${attrs.date}T${attrs.start_time}:00`).toISOString(),
          end_time: new Date(`${attrs.date}T${attrs.end_time}:00`).toISOString(),
          max_participants: attrs.max_participants,
        },
        { onSuccess, onError },
      );
    } else if (action === "update" && eventId) {
      updateEvent(
        {
          id: eventId,
          title: attrs.title,
          color: attrs.color,
          start_time: new Date(`${attrs.date}T${attrs.start_time}:00`).toISOString(),
          end_time: new Date(`${attrs.date}T${attrs.end_time}:00`).toISOString(),
          max_participants: attrs.max_participants,
        },
        { onSuccess, onError },
      );
    } else if (action === "delete" && eventId) {
      deleteEvent(eventId, { onSuccess, onError });
    }
  };

  const handleCancel = (messageId: string) => {
    markMessage(messageId, { status: "cancelled" });
  };

  return (
    <div className="w-[min(92vw,360px)] h-[min(70vh,520px)] rounded-2xl border border-(--border) bg-bg shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border) shrink-0">
        <p className="text-sm font-semibold text-text-primary">
          일정 챗봇
        </p>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-accent transition"
        >
          <X size={16} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
      >
        {messages.map((m) => {
          if ("action" in m) {
            return (
              <div key={m.id} className="flex justify-start">
                <ScheduleConfirmCard
                  action={m.action}
                  attrs={m.attrs}
                  dateCorrected={m.dateCorrected}
                  status={m.status}
                  error={m.error}
                  isLoading={confirmingId === m.id}
                  onConfirm={() =>
                    handleConfirm(m.id, m.action, m.attrs, m.eventId)
                  }
                  onCancel={() => handleCancel(m.id)}
                />
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-xl px-3 py-2 text-sm bg-accent text-white"
                    : "max-w-[85%] rounded-xl px-3 py-2 text-sm bg-surface-2 text-text-primary"
                }
              >
                {m.text}
              </p>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start">
            <p className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-surface-2 text-text-secondary">
              생각하는 중...
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-3 border-t border-(--border) shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="예) 다음주 금요일 저녁 8시에 축구하자"
          disabled={isSending}
        />
        <Button
          size="sm"
          className="shrink-0 px-3"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
