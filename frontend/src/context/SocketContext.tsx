import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "../api/client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    // `auth` as a function (not a plain object) is re-invoked on every
    // (re)connection attempt, so a socket that drops and reconnects after
    // the in-memory access token has been silently refreshed still presents
    // a currently-valid token instead of the one captured at mount time.
    const instance = io(import.meta.env.VITE_API_URL, {
      auth: (callback) => callback({ token: getAccessToken() }),
    });

    setSocket(instance);
    return () => {
      instance.disconnect();
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
