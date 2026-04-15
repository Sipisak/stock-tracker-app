"use client";

import { useEffect } from "react";

import { toast } from "sonner";
import {socket} from "@/lib/websocket/socket-client";

export default function RealtimeAlerts({ userId }: { userId: string }) {
    useEffect(() => {
        if (!userId) return;

        socket.connect();

        function onConnect() {
            console.log("Připojeno k realtime serveru");

            socket.emit("identify", userId);
        }

        function onAlertFired(data: { symbol: string; price: number; message: string }) {
            toast.success("Alert splněn! 🚨", {
                description: data.message,
            });
        }

        socket.on("connect", onConnect);
        socket.on("alert:fired", onAlertFired);

        return () => {
            socket.off("connect", onConnect);
            socket.off("alert:fired", onAlertFired);
            socket.disconnect();
        };
    }, [userId]);

    return null;
}