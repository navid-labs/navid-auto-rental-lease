import { create } from "zustand";
import type { AdminRole } from "@/types/admin";

interface AdminRoleState {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
}

export const useAdminRoleStore = create<AdminRoleState>((set) => ({
  role: (typeof window !== "undefined"
    ? (localStorage.getItem("adminRole") as AdminRole)
    : null) || "admin",
  setRole: (role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminRole", role);
    }
    set({ role });
  },
}));
