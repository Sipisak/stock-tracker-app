import type { AlertCondition } from "@/database/models/alert.model";

export function didCrossThreshold(params: {
    condition: AlertCondition;
    prev: number | null | undefined;
    current: number;
    threshold: number;
}): boolean {
    const { condition, prev, current, threshold } = params;

    // First tick: no previous value => don't trigger (avoids false positives)
    if (prev === null || prev === undefined) return false;

    if (condition === "upper") {
        return prev <= threshold && current > threshold;
    }
    // "lower" / BELOW
    return prev >= threshold && current < threshold;
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


    if (initial === null || initial === undefined) return false;


    const percentChange = ((current - initial) / initial) * 100;

    if (condition === "upper") {
        return percentChange >= threshold;
    }


    return percentChange <= -Math.abs(threshold);
}