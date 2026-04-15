import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import WebSocket from "ws";
import {processTick} from "@/lib/alerts/proccesTick";



const PORT = Number(process.env.PORT || 4001);
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const server = http.createServer();
const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"] : "*",
        methods: ["GET", "POST"],
    },
});

const subscribedSymbols = new Set<string>();

function connectFinnhub() {
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

    ws.on("open", () => {
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

                // 🚨 TOTO JE HLAVNÉ: Tiché vyhodnotenie podmienok na pozadí
                // processTick vezme aktuálnu cenu a porovná ju s pravidlami v MongoDB
                const result = await processTick({
                    symbol,
                    alertType: "price",
                    currentValue: currentPrice,
                    observedAt: new Date(ts),
                });

                // Ak processTick zistí, že cena stúpla/klesla podľa podmienky užívateľa...
                if (result && result.triggered > 0) {
                    console.log(`🚨 ALERT TRIGGER: ${symbol} splnil podmienku pri cene ${currentPrice}!`);

                    // 1. processTick už uložil AlertEvent do databázy

                    // 2. Ak je užívateľ práve online v aplikácii, pošleme mu realtime notifikáciu
                    io.to(`alerts:${symbol}`).emit("alert:fired", {
                        symbol,
                        price: currentPrice,
                        time: ts,
                        message: `Upozornenie: Akcia ${symbol} dosiahla cenu ${currentPrice}`
                    });

                    // 3. (Voliteľné) Tu môžeš odpáliť Inngest event pre odoslanie emailu:
                    // fetch('https://tvoja-next-app/api/inngest', { method: 'POST', body: ... })
                }
            }
        } catch (err) {
            console.error("❌ Chyba pri spracovaní tiku:", err);
        }
    });

    // ... (zvyšok ws.on('close') a ws.on('error') zostáva rovnaký)
    return ws;
}

// ... (inicializácia a socket.io pripojenia)