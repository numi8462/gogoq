"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Event } from "@/types";
import ChatPanel from "./ChatPanel";

interface Props {
  groupId: string;
  events: Event[];
}

export default function ChatWidget({ groupId, events }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <ChatPanel
          groupId={groupId}
          events={events}
          onClose={() => setIsOpen(false)}
        />
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "챗봇 닫기" : "일정 챗봇 열기"}
        className="w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent-hover active:scale-95 transition"
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
