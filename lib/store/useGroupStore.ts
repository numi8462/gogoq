import { create } from "zustand";

type GroupStore = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;

  nickname: string;
  setNickname: (nickname: string) => void;
};

export const useGroupStore = create<GroupStore>((set) => ({
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),

  nickname: "",
  setNickname: (nickname) => set({ nickname }),
}));
