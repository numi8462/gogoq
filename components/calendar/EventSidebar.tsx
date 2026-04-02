"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Event } from "@/types";
import EventCard from "@/components/event/EventCard";
import EventForm from "@/components/event/EventForm";

type Props = {
  selectedDate: Date | null;
  events: Event[];
  groupId: string;
};

export default function EventSidebar({ selectedDate, events, groupId }: Props) {
  const [showForm, setShowForm] = useState(false);

  if (!selectedDate) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        날짜를 선택하면 일정이 표시돼요
      </div>
    );
  }

  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.start_time), selectedDate),
  );

  return (
    <>
      <div className="flex flex-col gap-3 h-full md:max-h-[calc(100vh-110px)] md:overflow-y-auto event-sidebar-scroll scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 hover:scrollbar-thumb-gray-500">
        <div className="flex items-center justify-between shrink-0 px-2">
          <h2 className="text-base font-semibold text-gray-100">
            {format(selectedDate, "M월 d일 EEEE", { locale: ko })}
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-indigo-500 hover:text-indigo-700 
                       font-medium transition cursor-pointer"
          >
            + 일정 추가
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-gray-400">이 날 등록된 일정이 없어요</p>
          ) : (
            dayEvents.map((event) => (
              <EventCard key={event.id} event={event} groupId={groupId} />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <EventForm
          groupId={groupId}
          selectedDate={selectedDate}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
