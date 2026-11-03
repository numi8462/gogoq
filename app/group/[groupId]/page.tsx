"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Check, Link, Pencil } from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import EventSidebar from "@/components/calendar/EventSidebar";
import NicknameModal from "@/components/ui/NicknameModal";
import ChatWidget from "@/components/chat/ChatWidget";
import EditGroupNameModal from "@/components/group/EditGroupNameModal";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import { useEvents } from "@/hooks/useEvents";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUser } from "@/hooks/useUser";
import { recordGroupVisit } from "@/hooks/useMyGroups";
import { createClient } from "@/lib/supabase/client";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const { data: events = [], isLoading } = useEvents(groupId);
  useRealtimeSync(groupId);
  const { user } = useUser();

  useEffect(() => {
    const fetchGroup = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("groups")
        .select("invite_code, name, creator_id")
        .eq("id", groupId)
        .single();
      if (data) {
        setInviteCode(data.invite_code);
        setGroupName(data.name);
        setCreatorId(data.creator_id);
      }
    };
    fetchGroup();
  }, [groupId]);

  // 로그인 사용자가 그룹을 방문하면 "참여한 방"으로 자동 기록
  useEffect(() => {
    if (user) recordGroupVisit(groupId, user.id).catch(() => {});
  }, [groupId, user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite/${inviteCode}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center h-screen bg-bg text-text-secondary text-sm motion-safe:animate-pulse"
      >
        캘린더를 불러오는 중이에요
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-80 bg-bg">
      <NicknameModal />

      {/* 헤더 */}
      <header className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md bg-bg/80 border-b border-(--border)">
        <div className="flex items-center gap-2 min-w-0">
          <Logo size="sm" />
          {groupName && (
            <>
              <span aria-hidden className="h-4 w-px bg-(--border)" />
              <h1 className="text-base font-semibold tracking-[-0.01em] text-text-primary truncate">
                {groupName}
              </h1>
            </>
          )}
          {user && creatorId === user.id && (
            <button
              onClick={() => setIsEditingName(true)}
              aria-label="그룹 이름 수정"
              className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-2 transition-colors shrink-0"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        {inviteCode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <Check size={14} className="text-accent" />
            ) : (
              <Link size={14} />
            )}
            <span aria-live="polite">{copied ? "복사했어요" : "초대 링크"}</span>
          </Button>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <div className="h-full">
          <CalendarView
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>
        <EventSidebar
          selectedDate={selectedDate}
          events={events}
          groupId={groupId}
        />
      </main>

      <ChatWidget groupId={groupId} events={events} />

      {isEditingName && (
        <EditGroupNameModal
          groupId={groupId}
          currentName={groupName ?? ""}
          onClose={() => setIsEditingName(false)}
          onSaved={setGroupName}
        />
      )}
    </div>
  );
}
