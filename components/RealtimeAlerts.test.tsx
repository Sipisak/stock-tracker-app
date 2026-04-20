import { render, act } from "@testing-library/react";
import RealtimeAlerts from "./RealtimeAlerts";
import { toast } from "sonner";
import { socket } from "@/lib/websocket/socket-client";

// 1. Namockování knihovny Sonner (aby se reálně nevykreslovala na obrazovku)
jest.mock("sonner", () => ({
    toast: {
        success: jest.fn(),
    },
}));

// 2. Namockování Socket.io klienta
// Potřebujeme si ukládat zaregistrované callbacky, abychom je mohli v testu ručně zavolat
const eventCallbacks: Record<string, Function> = {};

jest.mock("@/lib/websocket/socket-client", () => ({
    socket: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        emit: jest.fn(),
        on: jest.fn((event: string, callback: Function) => {
            eventCallbacks[event] = callback; // Uložíme si funkci, co poslouchá
        }),
        off: jest.fn((event: string) => {
            delete eventCallbacks[event]; // Úklid při odpojení
        }),
        auth: {}, // Simulace objektu pro přihlášení
    },
}));

describe("RealtimeAlerts Component", () => {
    beforeEach(() => {
        // Před každým testem vyčistíme historii volání
        jest.clearAllMocks();
    });

    it("měla by se připojit k socketu a předat userId", () => {
        render(<RealtimeAlerts userId="test-user-123" />);

        // Ověříme, že komponenta nastavila průkazku a zavolala connect
        expect(socket.auth).toEqual({ userId: "test-user-123" });
        expect(socket.connect).toHaveBeenCalledTimes(1);
    });

    it("měla by zobrazit toast notifikaci, když přijde událost 'alert:fired'", () => {
        render(<RealtimeAlerts userId="test-user-123" />);

        // 1. Připravíme si falešná data, která by normálně poslal Railway
        const mockPayload = {
            symbol: "NVDA",
            price: 200.50,
            message: "Akcie NVDA dosáhla cílové ceny 200.50$",
            timings: {
                receivedAt: 1000,
                evaluatedAt: 1010,
                savedAt: 1050,
                emittedAt: 1060
            }
        };

        // 2. Simulujeme, že z backendu přiletěl signál (zavoláme uložený callback)
        act(() => {
            if (eventCallbacks["alert:fired"]) {
                eventCallbacks["alert:fired"](mockPayload);
            }
        });

        // 3. Ověříme, že komponenta správně zareagovala zobrazením toastu
        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
            "Alert Spuštěn",
            expect.objectContaining({
                description: "Akcie NVDA dosáhla cílové ceny 200.50$"
            })
        );
    });

    it("měla by se odpojit od socketu při zničení komponenty (unmount)", () => {
        const { unmount } = render(<RealtimeAlerts userId="test-user-123" />);

        // Zničíme komponentu (uživatel odešel ze stránky)
        unmount();

        // Ověříme, že se uklidily listenery a socket se odpojil
        expect(socket.off).toHaveBeenCalledWith("alert:fired", expect.any(Function));
        expect(socket.disconnect).toHaveBeenCalledTimes(1);
    });
});