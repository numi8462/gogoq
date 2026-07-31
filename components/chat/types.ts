import { EventColor } from "@/types";

export type ScheduleAction = "create" | "update" | "delete";

export type ScheduleAttrs = {
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  max_participants: number;
  color: EventColor;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string }
  | {
      id: string;
      role: "assistant";
      action: ScheduleAction;
      eventId?: string; // update/delete 대상 일정 id
      attrs: ScheduleAttrs;
      dateCorrected?: boolean;
      status: "pending" | "confirmed" | "cancelled";
      error?: string;
    };
