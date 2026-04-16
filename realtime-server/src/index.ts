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
        credentials: true,
    },
});

const subscribedSymbols = new Set<string>();
let finnhubWs: WebSocket | null = null;
let isReconcilingSubscriptions = false;

function sendFinnhubSubscription(type: "subscribe" | "unsubscribe", symbol: string) {
    if (!finnhubWs || finnhubWs.readyState !== WebSocket.OPEN) return;
    finnhubWs.send(JSON.stringify({ type, symbol }));
}

function subscribeSymbol(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase().trim();
    if (subscribedSymbols.has(normalizedSymbol)) return false;

    subscribedSymbols.add(normalizedSymbol);
    sendFinnhubSubscription("subscribe", normalizedSymbol);
    return true;
}

function unsubscribeSymbol(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase().trim();
    if (!subscribedSymbols.has(normalizedSymbol)) return false;

    subscribedSymbols.delete(normalizedSymbol);
    sendFinnhubSubscription("unsubscribe", normalizedSymbol);
    return true;
}

async function seedSubscribedSymbols() {
    const enabledAlerts = await Alert.find({ enabled: true }).select({ symbol: 1 }).lean();

    for (const alert of enabledAlerts) {
        if (!alert.symbol) continue;
        subscribedSymbols.add(alert.symbol.toUpperCase().trim());
    }
}
function syncSubscribedSymbol(symbol: string, enabled: boolean) {
    const normalizedSymbol = symbol.toUpperCase().trim();

    if (enabled) {
        subscribeSymbol(normalizedSymbol);
        return;
    }

    unsubscribeSymbol(normalizedSymbol);
}

function connectFinnhub() {
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);
    finnhubWs = ws;

    ws.on("open", () => {
        console.log(`✅ Connected to Finnhub WS. Watching these ${subscribedSymbols.size} stocks:`, Array.from(subscribedSymbols));
        console.log("✅ Connected to Finnhub WS.  ");
        for (const symbol of subscribedSymbols) {
            ws.send(JSON.stringify({ type: "subscribe", symbol }));
        }
    });

    ws.on("message", async (raw) => {
        const t1 = Date.now();

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
                        receivedAt: t1,
                    });

                    if (result && result.triggered > 0 && result.triggeredAlerts) {
                        console.log(`🚨 ALERT TRIGGER: ${symbol} at the price ${currentPrice}! I'm sending out ${result.triggered} users.`);

                        for (const triggeredAlert of result.triggeredAlerts) {
                            const { userId, alertId, timings } = triggeredAlert;

                            const t4 = Date.now();

                            io.to(`user:${userId}`).emit("alert:fired", {
                                symbol,
                                price: currentPrice,
                                message: `Stocks ${symbol} has reached your target price ${currentPrice}$`,
                                timings: {
                                    ...timings,
                                    emittedAt: t4
                                }
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
                            }).catch(err => console.error(`❌ The Inngest trigger for the user failed ${userId}:`, err));
                        }
                    }
                }
            }
        } catch (err) {
            console.error("❌ Error processing the tick:", err);
        }
    });

    ws.on("close", () => {
        console.warn("⚠️ Finnhub disconnected; attempting to reconnect in 3 seconds...");
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
        console.log(`👤 User ${verifiedUserId} connected to his private room`);
    }

    socket.on("identify", () => {
        const currentUserId = socket.data.userId as string | undefined;
        if (!currentUserId) return;

        for (const room of socket.rooms) {
            if (room.startsWith("user:") && room !== `user:${currentUserId}`) {
                socket.leave(room);
            }
        }

        socket.data.userId = currentUserId;
        socket.join(`user:${currentUserId}`);

        console.log(`👤 User ${currentUserId} identified`);
    });
});


async function bootstrap() {
    try {
        await connectToDatabase();
        console.log("✅ DB connected");

        await seedSubscribedSymbols();
        connectFinnhub();

        setInterval(async () => {
            if (isReconcilingSubscriptions) return;
            isReconcilingSubscriptions = true;

            try {
                console.log("🔄 Synchronization symbols with DB ...");

                const enabledAlerts = await Alert.find({ enabled: true }).select({ symbol: 1 }).lean();
                const enabledSymbols = new Set<string>();

                for (const alert of enabledAlerts) {
                    if (!alert.symbol) continue;
                    enabledSymbols.add(alert.symbol.toUpperCase().trim());
                }

                for (const symbol of enabledSymbols) {
                    if (!subscribedSymbols.has(symbol)) {
                        syncSubscribedSymbol(symbol, true);
                    }
                }

                for (const symbol of [...subscribedSymbols]) {
                    if (!enabledSymbols.has(symbol)) {
                        unsubscribeSymbol(symbol);
                    }
                }
            } finally {
                isReconcilingSubscriptions = false;
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
