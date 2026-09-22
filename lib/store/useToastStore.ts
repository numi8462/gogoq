import { create } from "zustand";
import { nanoid } from "nanoid";

type Toast = {
  id: string;
  message: string;
  variant: "success" | "error";
};

type ToastStore = {
  toasts: Toast[];
  showToast: (message: string, variant?: Toast["variant"]) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, variant = "success") => {
    const id = nanoid();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
