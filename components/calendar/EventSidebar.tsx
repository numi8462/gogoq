"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Plus } from "lucide-react";
import { Event } from "@/types";
import EventCard from "@/components/event/EventCard";
import EventForm from "@/components/event/EventForm";

interface EventSidebarProps {
  selectedDate: Date | null;
  events: Event[];
  groupId: string;
}

export default function EventSidebar({
  selectedDate,
  events,
  groupId,
}: EventSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full min-h-40 rounded-2xl border border-dashed border-(--border) text-text-secondary text-sm">
        <CalendarDays size={20} aria-hidden />
        날짜를 선택하면 일정이 표시돼요
      </div>
    );
  }

  const dayEvents = events.filter((e) =>
    isSameDay(new Date(e.start_time), selectedDate),
  );

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  return (
    <>
      <div className="flex flex-col gap-3 h-full md:max-h-[calc(100vh-110px)] md:overflow-y-auto event-sidebar-scroll scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 hover:scrollbar-thumb-gray-500">
        <div className="flex items-center justify-between shrink-0 px-2">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-text-primary">
            {format(selectedDate, "M월 d일 EEEE", { locale: ko })}
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="-mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-accent
                       hover:bg-accent/10 transition-colors cursor-pointer"
          >
            <Plus size={16} aria-hidden />
            일정 추가
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {dayEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-(--border) px-4 py-6 text-center text-sm text-text-secondary">
              이 날 등록된 일정이 없어요
            </p>
          ) : (
            dayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                groupId={groupId}
                onEdit={(event) => setEditingEvent(event)}
              />
            ))
          )}
        </div>
      </div>

      {(showForm || editingEvent) && (
        <EventForm
          groupId={groupId}
          selectedDate={selectedDate}
          onClose={handleCloseForm}
          defaultValues={editingEvent ?? undefined}
        />
      )}
    </>
  );
}
