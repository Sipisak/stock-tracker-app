import { connectToDatabase } from "@/database/mongoose";
import { Alert } from '@/database/models/alert.model';
import { didCrossThreshold, isCooldownOver, didCrossPercentThreshold } from "@/lib/alerts/evaluate";
import AlertEvent  from "@/database/models/alertEvent.models";

type AlertType = "price" | "percent" | "volume";

export async function processTick(params: {
    symbol: string;
    alertType: AlertType;
    currentValue: number;
    observedAt?: Date;
    receivedAt: number;
}) {
    const now = params.observedAt ?? new Date();
    const symbol = params.symbol.toUpperCase().trim();


    if (!Number.isFinite(params.currentValue)) return { triggered: 0, triggeredAlerts: [] };

    await connectToDatabase();

    const rules = await Alert.find({
        symbol,
        "alertType": params.alertType,
        "enabled": true,
    }).lean();

    let triggeredCount = 0;

    const triggeredAlerts: Array<{ alertId: string; userId: string }> = [];

    for (const rule of rules) {
        const prev = rule.lastSeenValue ?? null;
        let crossed = false;

        if (rule.alertType === "percent") {
            crossed = didCrossPercentThreshold({
                condition: rule.condition,
                initial: prev,
                current: params.currentValue,
                threshold: rule.threshold,
            });
        } else {
            crossed = didCrossThreshold({
                condition: rule.condition,
                prev,
                current: params.currentValue,
                threshold: rule.threshold,
            });
        }

        const t2 = Date.now();

        const cooldownOk = isCooldownOver({
            lastTriggeredAt: rule.lastTriggeredAt ?? null,
            cooldownMinutes: rule.cooldownMinutes ?? 15,
            now,
        });
        if (crossed && cooldownOk) {
            const cooldownMs = (rule.cooldownMinutes ?? 15) * 60 * 1000;
            const latestAllowed = new Date(now.getTime() - cooldownMs);

            // Atomic guard prevents duplicate triggers
            const updated = await Alert.findOneAndUpdate(
                {
                    _id: rule._id,
                    enabled: true,
                    lastSeenValue: rule.lastSeenValue ?? null,
                    $or: [{ lastTriggeredAt: null }, { lastTriggeredAt: { $lte: latestAllowed } }],
                },
                {
                    $set: {
                        lastTriggeredAt: now,
                        lastSeenValue: params.currentValue,
                    },
                },
                { new: true }
            ).lean();

            const t3 = Date.now();

            if (updated) {
                await AlertEvent.create({
                    ruleId: updated._id,
                    userId: updated.userId,
                    symbol: updated.symbol,
                    alertType: updated.alertType,
                    condition: updated.condition,
                    threshold: updated.threshold,
                    triggerValue: params.currentValue,
                    triggeredAt: now,
                    reason: "threshold_crossing",
                });

                triggeredCount += 1;


                triggeredAlerts.push({
                    alertId: updated._id.toString(),
                    userId: updated.userId,
                    timings: {
                        receivedAt: params.receivedAt,
                        evaluatedAt: t2,
                        savedAt: t3
                    }
                });

                continue;
            }
        }


        if (rule.alertType !== "percent" || prev === null) {
            await Alert.updateOne(
                {_id: rule._id},
                {$set: {lastSeenValue: params.currentValue}}
            );
        }
    }

    
    return {
        triggered: triggeredCount,
        triggeredAlerts
    };
}