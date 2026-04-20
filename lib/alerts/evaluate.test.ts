import { didCrossThreshold, isCooldownOver } from "@/lib/alerts/evaluate";

describe("Integrační testy: Vyhodnocovací engin (Kapitola 6.4)", () => {

    describe("Zpracování podmínek (Edge-cases)", () => {
        it("Mělo by detekovat překročení maxima (upper limit)", () => {
            const result = didCrossThreshold({
                condition: "upper",
                prev: 145,         // Předchozí cena
                current: 155,      // Aktuální cena (přeskočila hranici)
                threshold: 150     // Nastavená hranice alertu
            });
            expect(result).toBe(true);
        });

        it("Mělo by detekovat pokles pod minimum (lower limit)", () => {
            const result = didCrossThreshold({
                condition: "lower",
                prev: 210,
                current: 195,
                threshold: 200
            });
            expect(result).toBe(true);
        });

        it("Nemělo by spustit alert, pokud podmínka nebyla protnuta (ignorování)", () => {
            const result = didCrossThreshold({
                condition: "upper",
                prev: 140,
                current: 149,
                threshold: 150
            });
            expect(result).toBe(false);
        });
    });

    describe("Zátěž a oscilace (Cooldown mechanismus)", () => {
        it("Mělo by propustit první tik (žádný předchozí záznam)", () => {
            const now = new Date("2026-04-19T15:00:00Z");

            const check = isCooldownOver({
                lastTriggeredAt: null,
                cooldownMinutes: 15,
                now
            });
            expect(check).toBe(true);
        });

        it("Mělo by zahodit duplicitní tiky v rámci ochranné lhůty (oscilace)", () => {
            const now = new Date("2026-04-19T15:05:00Z"); // Jen 5 minut po triggeru
            const lastTriggeredAt = new Date("2026-04-19T15:00:00Z");

            const check = isCooldownOver({
                lastTriggeredAt,
                cooldownMinutes: 15,
                now
            });
            expect(check).toBe(false); // Blokováno
        });

        it("Mělo by znovu povolit alert po uplynutí cooldown periody", () => {
            const now = new Date("2026-04-19T15:20:00Z"); // 20 minut po triggeru
            const lastTriggeredAt = new Date("2026-04-19T15:00:00Z");

            const check = isCooldownOver({
                lastTriggeredAt,
                cooldownMinutes: 15,
                now
            });
            expect(check).toBe(true); // Povoleno
        });
    });
});