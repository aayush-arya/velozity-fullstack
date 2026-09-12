import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

// Admin-only "active users online right now" - seeded from the REST
// dashboard payload (a snapshot at load time), then kept current purely by
// the server's presence broadcasts. Intentionally not persisted anywhere:
// presence is only ever "right now," never something to catch up on later.
export function usePresence(initialCount: number): number {
  const socket = useSocket();
  const [count, setCount] = useState(initialCount);

  useEffect(() => setCount(initialCount), [initialCount]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { onlineCount: number }) => setCount(payload.onlineCount);
    socket.on("presence:update", handler);
    return () => {
      socket.off("presence:update", handler);
    };
  }, [socket]);

  return count;
}
