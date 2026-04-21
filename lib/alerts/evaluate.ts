import type { AlertCondition } from "@/database/models/alert.model";

export function didCrossThreshold(params: {
    condition: AlertCondition;
    prev: number | null | undefined;
    current: number;
    threshold: number;
}): boolean {
    const { condition, prev, current, threshold } = params;

    // 1. Úplně první tik: nemáme předchozí hodnotu (alert byl právě vytvořen)
    if (prev === null || prev === undefined) {
        // Pokud je aktuální cena už ZA hranicí, odpálíme alert rovnou!
        if (condition === "upper" && current >= threshold) return true;
        if (condition === "lower" && current <= threshold) return true;
        return false;
    }

    // 2. Klasické protnutí hranice
    if (condition === "upper") {
        // Cena byla pod hranicí a teď ji protnula (nebo se jí rovná)
        return prev < threshold && current >= threshold;
    }
    
    // "lower" / BELOW
    // Cena byla nad hranicí a teď klesla pod ni (nebo se jí rovná)
    return prev > threshold && current <= threshold;
}

export function isCooldownOver(params: {
    lastTriggeredAt?: Date | null;
    cooldownMinutes: number;
    now: Date;
}): boolean {
    const { lastTriggeredAt, cooldownMinutes, now } = params;
    if (!lastTriggeredAt) return true;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return now.getTime() - lastTriggeredAt.getTime() >= cooldownMs;
}

export function didCrossPercentThreshold(params: {
    condition: AlertCondition;
    initial: number | null | undefined;
    current: number;
    threshold: number;
}): boolean {
    const { condition, initial, current, threshold } = params;

    // U procent MUSÍME ignorovat první tik, protože z jedné hodnoty procento nespočítáme
    if (initial === null || initial === undefined) return false;

    const percentChange = ((current - initial) / initial) * 100;

    if (condition === "upper") {
        return percentChange >= threshold;
    }

    return percentChange <= -Math.abs(threshold);
}
