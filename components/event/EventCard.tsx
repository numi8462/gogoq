import { Event } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type Props = {
  event: Event;
  groupId: string;
};

export default function EventCard({ event }: Props) {
  const statusLabel = {
    open: "모집중",
    closed: "마감",
    cancelled: "취소됨",
  }[event.status];

  const statusColor = {
    open: "bg-green-100 text-green-700",
    closed: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-400",
  }[event.status];

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{event.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className="text-sm text-gray-500">
        {format(new Date(event.start_time), "HH:mm", { locale: ko })}
        {" ~ "}
        {format(new Date(event.end_time), "HH:mm", { locale: ko })}
      </div>
      <div className="text-sm text-gray-400">
        최대 {event.max_participants}명
      </div>
    </div>
  );
}
