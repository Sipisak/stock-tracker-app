"use client";

import { useEffect } from "react";

import { toast } from "sonner";
import {socket} from "@/lib/websocket/socket-client";

type AlertFiredPayload = {
    symbol: string;
    price: number;
    message: string;
    timings?: {
        receivedAt: number;
        evaluatedAt: number;
        savedAt: number;
        emittedAt: number;
    };
};

export default function RealtimeAlerts({ userId }: { userId: string }) {
    useEffect(() => {
        if (!userId) return;

       socket.auth = { userId };
        socket.connect();
        
        function onConnect() {
            console.log("Připojeno k realtime serveru");

            socket.emit("identify", userId);
        }

        function onConnectError(err: Error) {
            console.error("❌ Backend mě odmítl připojit. Důvod:", err.message);
        }

        function onAlertFired(data: AlertFiredPayload) {
            const displayedAt = Date.now();

            if (data.timings) {
                const metrics = {
                    "Vyhodnocení (CPU)": `${data.timings.evaluatedAt - data.timings.receivedAt} ms`,
                    "Zápis do DB (I/O)": `${data.timings.savedAt - data.timings.evaluatedAt} ms`,
                    "Příprava odeslání (WS)": `${data.timings.emittedAt - data.timings.savedAt} ms`,
                    "Zobrazení v UI (Síť + Render)": `${displayedAt - data.timings.emittedAt} ms`,
                    "CELKOVÁ LATENCE": `${displayedAt - data.timings.receivedAt} ms`,
                };

                console.log(`📊 MĚŘENÍ LATENCE PRO ${data.symbol}:`);
                console.table(metrics);
            }

            toast.success("Alert Spuštěn", {
                description: data.message,
            });
        }

        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("alert:fired", onAlertFired);

        return () => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.off("alert:fired", onAlertFired);
            socket.disconnect();
        };
    }, [userId]);

    return null;
}
