import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Real-time data
  pendingCount: number;
  activeUsers: number;
  setPendingCount: (count: number) => void;
  setActiveUsers: (count: number) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  pendingCount: 0,
  activeUsers: 0,
  setPendingCount: (count) => set({ pendingCount: count }),
  setActiveUsers: (count) => set({ activeUsers: count }),

  notifications: [],
  addNotification: (notif) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    set((state) => ({
      notifications: [{ ...notif, id, timestamp }, ...state.notifications].slice(0, 50),
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
