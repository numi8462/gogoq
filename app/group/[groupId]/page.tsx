"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CalendarView from "@/components/calendar/CalendarView";
import EventSidebar from "@/components/event/EventSidebar";
import { useEvents } from "@/hooks/useEvents";
import NicknameModal from "@/components/ui/NicknameModal";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useEvents(groupId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <>
      <NicknameModal />
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <CalendarView events={events} onDateSelect={setSelectedDate} />
        <EventSidebar
          selectedDate={selectedDate}
          events={events}
          groupId={groupId}
        />
      </div>
    </>
  );
}
