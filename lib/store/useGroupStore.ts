import { create } from "zustand";
import { persist } from "zustand/middleware";

type GroupStore = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  nickname: string;
  setNickname: (nickname: string) => void;
};

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      selectedDate: null,
      setSelectedDate: (date) => set({ selectedDate: date }),
      nickname: "",
      setNickname: (nickname) => set({ nickname }),
    }),
    {
      name: "gogoq-storage", // localStorage 키 이름
      partialize: (state) => ({ nickname: state.nickname }), // nickname만 저장 (selectedDate는 제외)
    },
  ),
);
