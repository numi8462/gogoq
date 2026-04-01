"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState } from "react";
import { Event } from "@/types";
import CalendarTile from "./CalendarTile";
import { isSameDay } from "date-fns";

type Props = {
  events: Event[];
  onDateSelect: (date: Date) => void;
};

export default function CalendarView({ events, onDateSelect }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleChange = (value: unknown) => {
    const date = value as Date;
    setSelectedDate(date);
    onDateSelect(date);
  };

  return (
    <div className="w-full">
      <Calendar
        onChange={handleChange}
        value={selectedDate}
        locale="ko-KR"
        calendarType="gregory"
        // 날짜 칸에 이벤트 뱃지 주입
        tileContent={({ date }) => <CalendarTile date={date} events={events} />}
        // 이벤트 있는 날 타일에 클래스 추가
        tileClassName={({ date }) => {
          const hasEvent = events.some((e) =>
            isSameDay(new Date(e.start_time), date),
          );
          return hasEvent ? "has-event" : null;
        }}
        className="w-full border-none shadow-none"
      />
    </div>
  );
}
