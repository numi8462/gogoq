"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link } from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import EventSidebar from "@/components/calendar/EventSidebar";
import NicknameModal from "@/components/ui/NicknameModal";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import { useEvents } from "@/hooks/useEvents";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { createClient } from "@/lib/supabase/client";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: events = [], isLoading } = useEvents(groupId);
  useRealtimeSync(groupId);

  useEffect(() => {
    const fetchInviteCode = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("invite_code")
        .eq("id", groupId)
        .single();
      if (data) setInviteCode(data.invite_code);
    };
    fetchInviteCode();
  }, [groupId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite/${inviteCode}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text-secondary text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <NicknameModal />

      {/* 헤더 */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm bg-bg/80 border-b border-(--border)">
        <Logo size="sm" />
        {inviteCode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex"
          >
            <Link size={14} className="mr-1.5" />
            {copied ? "복사됨 ✓" : "초대 링크"}
          </Button>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <CalendarView events={events} onDateSelect={setSelectedDate} />
        <EventSidebar
          selectedDate={selectedDate}
          events={events}
          groupId={groupId}
        />
      </main>
    </div>
  );
}
