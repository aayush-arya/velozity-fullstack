import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications";
import { useSocket } from "../context/SocketContext";
import type { NotificationItem } from "../types";

const queryKey = ["notifications"] as const;

interface NotificationsData {
  items: NotificationItem[];
  unreadCount: number;
}

export function useNotifications() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey, queryFn: () => notificationsApi.listNotifications(1, 20) });

  useEffect(() => {
    if (!socket) return;

    // The unread badge is driven entirely by this push - there is no
    // polling interval anywhere in the app re-fetching the count.
    const handleNew = (payload: { notification: NotificationItem; unreadCount: number }) => {
      queryClient.setQueryData<NotificationsData>(queryKey, (old) => ({
        items: [payload.notification, ...(old?.items ?? [])].slice(0, 50),
        unreadCount: payload.unreadCount,
      }));
    };

    const handleReconnect = () => {
      void queryClient.invalidateQueries({ queryKey });
    };

    socket.on("notification:new", handleNew);
    socket.on("connect", handleReconnect);
    return () => {
      socket.off("notification:new", handleNew);
      socket.off("connect", handleReconnect);
    };
  }, [socket, queryClient]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<NotificationsData>(queryKey, (old) => {
        if (!old) return old;
        const target = old.items.find((n) => n.id === id);
        return {
          items: old.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadCount: target && !target.isRead ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
        };
      });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsData>(queryKey, (old) =>
        old ? { items: old.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 } : old
      );
    },
  });

  return {
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
  };
}
