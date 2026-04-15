import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import WebSocket from "ws";
import { processTick } from "@/lib/alerts/proccesTick";
import { connectToDatabase } from "@/database/mongoose";

const PORT = Number(process.env.PORT || 4001);
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
    console.error("❌ Chýba FINNHUB_API_KEY!");
}

const server = http.createServer();
const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"] : "*",
        methods: ["GET", "POST"],
    },
});

let subscribedSymbols = new Set<string>();

function connectFinnhub() {
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

    ws.on("open", () => {
        console.log("✅ Pripojené k Finnhub WS - Tichý strážca spustený");

    });

    ws.on("message", async (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

            for (const trade of msg.data) {
                const symbol = trade.s as string;
                const currentPrice = trade.p as number;
                const ts = trade.t as number;


                const result = await processTick({
                    symbol,
                    alertType: "price",
                    currentValue: currentPrice,
                    observedAt: new Date(ts),
                });


                if (result && result.triggered > 0 && result.triggeredAlerts) {
                    console.log(`🚨 ALERT TRIGGER: ${symbol} pri cene ${currentPrice}! Rozosielam ${result.triggered} užívateľom.`);


                    for (const triggeredAlert of result.triggeredAlerts) {
                        const { userId, alertId } = triggeredAlert;


                        io.to(`user:${userId}`).emit("alert:fired", {
                            symbol,
                            price: currentPrice,
                            message: `Akcia ${symbol} dosiahla tvoju cieľovú cenu ${currentPrice}$`
                        });


                        const NEXT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                        fetch(`${NEXT_APP_URL}/api/inngest`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: "app/alert.triggered",
                                data: {
                                    userId,
                                    symbol,
                                    price: currentPrice,
                                    alertId
                                }
                            })
                        }).catch(err => console.error(`❌ Zlyhal Inngest trigger pre užívateľa ${userId}:`, err));
                    }
                }
            }
        } catch (err) {
            console.error("❌ Chyba pri spracovaní tiku:", err);
        }
    });

    ws.on("close", () => {
        console.warn("⚠️ Finnhub odpojený, pokus o znovupripojenie za 3s...");
        setTimeout(connectFinnhub, 3000);
    });

    ws.on("error", (err) => {
        console.error("❌ Finnhub WS error:", err);
        ws.close();
    });

    return ws;
}


io.on("connection", (socket) => {
    socket.on("identify", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`👤 Užívateľ ${userId} pripojený do svojej privátnej miestnosti`);
    });
});


async function bootstrap() {
    try {
        await connectToDatabase();
        console.log("✅ Databáza pripojená");

        connectFinnhub();


        server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Realtime server beží na porte ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Zlyhal štart servera:", error);
        process.exit(1);
    }
}

bootstrap();