"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Event } from "@/types";
import CalendarTile from "./CalendarTile";
import { isSameDay } from "date-fns";

type Props = {
  events: Event[];
  /** 선택 날짜는 그룹 페이지가 관리한다. 징검다리 보드에서 고른 날짜도 캘린더에 같이 표시되게 하려는 것. */
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
};

export default function CalendarView({ events, selectedDate, onDateSelect }: Props) {
  const handleChange = (value: unknown) => {
    onDateSelect(value as Date);
  };

  return (
    <div className="w-full h-full overflow-hidden">
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
