import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivityFeed, type ActivityFeedResponse } from "../api/misc";
import { useSocket } from "../context/SocketContext";
import type { ActivityFeedEvent } from "../types";

const MAX_BUFFERED_EVENTS = 50;

// Backs "who did what, when" for a project board (projectId set) or a
// role's global feed (projectId omitted). The initial 20 always comes from
// the database (satisfies the "catch up after being offline" requirement);
// after that, `activity:new` socket events are prepended live, and a socket
// `connect` (which also fires on *re*connect after a drop) re-pulls the
// same DB-backed endpoint so a reconnecting client re-syncs from Postgres
// rather than trusting whatever it happened to buffer in memory.
export function useActivityFeed(projectId?: string) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["activity-feed", projectId ?? "all"] as const, [projectId]);

  const query = useQuery({
    queryKey,
    queryFn: () => getActivityFeed({ limit: 20, projectId }),
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (event: ActivityFeedEvent) => {
      if (projectId && event.projectId !== projectId) return;
      queryClient.setQueryData<ActivityFeedResponse>(queryKey, (old) => {
        if (!old) return old;
        if (old.items.some((item) => item.id === event.id)) return old;
        return { ...old, items: [event, ...old.items].slice(0, MAX_BUFFERED_EVENTS) };
      });
    };

    const handleReconnect = () => {
      void queryClient.invalidateQueries({ queryKey });
    };

    socket.on("activity:new", handleNewActivity);
    socket.on("connect", handleReconnect);
    return () => {
      socket.off("activity:new", handleNewActivity);
      socket.off("connect", handleReconnect);
    };
  }, [socket, projectId, queryClient, queryKey]);

  return query;
}
