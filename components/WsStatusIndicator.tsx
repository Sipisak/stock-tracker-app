"use client";

import { useState, useEffect } from "react";
import {socket} from "@/lib/websocket/socket-client";

export function WsStatusIndicator() {
    const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");

    useEffect(() => {
        function onConnect() { setStatus("connected"); }
        function onDisconnect() { setStatus("disconnected"); }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (socket.connected) {
            setStatus("connected");
        } else if (socket.disconnected) {
            setStatus("disconnected");
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 px-2" title="Stav realtime připojení">
      <span className="relative flex h-2.5 w-2.5">
        {status === "connected" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        )}
          <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  status === "connected"
                      ? "bg-green-500"
                      : status === "connecting"
                          ? "bg-yellow-500"
                          : "bg-red-500"
              }`}
          ></span>
      </span>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
        {status === "connected" ? "Live" : "Offline"}
      </span>
        </div>
    );
}