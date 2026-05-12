import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(requisitionId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Determine the WS URL (same as the page host)
    // In Vite dev, the server runs on the same port, so we connect to window.location.origin
    socketRef.current = io(window.location.origin);

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket");
      socketRef.current?.emit("join_requisition", requisitionId);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [requisitionId]);

  return socketRef.current;
}
