import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import WebSocket from "ws";
import { processTick } from "@/lib/alerts/proccesTick";
import { connectToDatabase } from "@/database/mongoose";
import {Alert} from "@/database/models/alert.model";

const PORT = Number(process.env.PORT || 4001);
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
    console.error("❌ FINNHUB_API_KEY!");
}

const server = http.createServer();
const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"] : "*",
        methods: ["GET", "POST"],
    },
});

const subscribedSymbols = new Set<string>();
let finnhubWs: WebSocket | null = null;

function sendFinnhubSubscription(type: "subscribe" | "unsubscribe", symbol: string) {
    if (!finnhubWs || finnhubWs.readyState !== WebSocket.OPEN) return;
    finnhubWs.send(JSON.stringify({ type, symbol }));
}

async function seedSubscribedSymbols() {
    const enabledAlerts = await Alert.find({ enabled: true }).select({ symbol: 1 }).lean();

    for (const alert of enabledAlerts) {
        if (!alert.symbol) continue;
        subscribedSymbols.add(alert.symbol);
    }
}

function syncSubscribedSymbol(symbol: string, enabled: boolean) {
    const normalizedSymbol = symbol.toUpperCase().trim();

    if (enabled) {
        const wasMissing = !subscribedSymbols.has(normalizedSymbol);
        subscribedSymbols.add(normalizedSymbol);
        if (wasMissing) {
            sendFinnhubSubscription("subscribe", normalizedSymbol);
        }
        return;
    }

    const wasPresent = subscribedSymbols.delete(normalizedSymbol);
    if (wasPresent) {
        sendFinnhubSubscription("unsubscribe", normalizedSymbol);
    }
}

function connectFinnhub() {
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);
    finnhubWs = ws;

    ws.on("open", () => {
        console.log(`✅ Připojeno k Finnhub WS. Aktuálně sleduji ${subscribedSymbols.size} symbolů:`, Array.from(subscribedSymbols));
        console.log("✅ Pripojené k Finnhub WS - Tichý strážca spustený");
        for (const symbol of subscribedSymbols) {
            ws.send(JSON.stringify({ type: "subscribe", symbol }));
        }
    });

    ws.on("message", async (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

            for (const trade of msg.data) {
                const symbol = trade.s as string;
                const currentPrice = trade.p as number;
                const ts = trade.t as number;

                for (const alertType of ["price", "percent"] as const) {
                    const result = await processTick({
                        symbol,
                        alertType,
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


io.use(async (socket, next) => {
    try {
        const userId = socket.handshake.auth?.userId;

        if (!userId || typeof userId !== "string") {
            return next(new Error("Unauthorized"));
        }

        socket.data.userId = userId;
        return next();
    } catch (error) {
        return next(new Error("Unauthorized"));
    }
});

io.on("connection", (socket) => {
    const verifiedUserId = socket.data.userId as string | undefined;

    if (verifiedUserId) {
        socket.join(`user:${verifiedUserId}`);
        console.log(`👤 Užívateľ ${verifiedUserId} pripojený do svojej privátnej miestnosti`);
    }

    socket.on("identify", () => {
    });
});


async function bootstrap() {
    try {
        await connectToDatabase();
        console.log("✅ DB connected");

        await seedSubscribedSymbols();
        connectFinnhub();

        setInterval(async () => {
            console.log("🔄 Synchronizujem symboly s databázou...");
            const enabledAlerts = await Alert.find({ enabled: true }).select({ symbol: 1 }).lean();

            for (const alert of enabledAlerts) {
                if (alert.symbol) {

                    syncSubscribedSymbol(alert.symbol, true);
                }
            }
        }, 60000);


        server.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Realtime server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ server failed:", error);
        process.exit(1);
    }
}

bootstrap();