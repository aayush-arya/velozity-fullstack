import type { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { logger } from "../utils/logger";

let io: Server | undefined;

// userId -> number of open sockets for that user (a user can have multiple
// tabs/devices open). Presence is inherently ephemeral/live state, so it is
// kept in memory by design - only the activity feed's catchup log is
// required to survive a restart, and that one lives in Postgres.
const onlineSockets = new Map<string, number>();

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export const ADMIN_ROOM = "role:admin";

function broadcastPresence() {
  io?.to(ADMIN_ROOM).emit("presence:update", { onlineCount: onlineSockets.size });
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  // Auth handshake: the same signed access token used for REST calls is
  // presented once when the socket connects, so an unauthenticated or
  // tampered token is rejected before the socket ever joins a room.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role, name: payload.name };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as { id: string; role: Role; name: string };
    socket.join(userRoom(user.id));
    if (user.role === Role.ADMIN) {
      socket.join(ADMIN_ROOM);
    }

    onlineSockets.set(user.id, (onlineSockets.get(user.id) ?? 0) + 1);
    broadcastPresence();
    logger.debug({ userId: user.id, onlineUsers: onlineSockets.size }, "socket connected");

    socket.on("disconnect", () => {
      const remaining = (onlineSockets.get(user.id) ?? 1) - 1;
      if (remaining <= 0) {
        onlineSockets.delete(user.id);
      } else {
        onlineSockets.set(user.id, remaining);
      }
      broadcastPresence();
      logger.debug({ userId: user.id, onlineUsers: onlineSockets.size }, "socket disconnected");
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io has not been initialized yet.");
  return io;
}

export function getOnlineUserCount(): number {
  return onlineSockets.size;
}
