import { connectToDatabase } from "@/database/mongoose"; // adjust name to your file export
import { Alert } from '@/database/models/alert.model';
import { didCrossThreshold, isCooldownOver } from "@/lib/alerts/evaluate";
import AlertEvent  from "@/database/models/alertEvent.models";

type AlertType = "price" | "percent" | "volume";

export async function processTick(params: {
    symbol: string;
    alertType: AlertType;
    currentValue: number;
    observedAt?: Date;
}) {
    const now = params.observedAt ?? new Date();
    const symbol = params.symbol.toUpperCase().trim();

    if (!Number.isFinite(params.currentValue)) return { triggered: 0 };

    await connectToDatabase();

    const rules = await Alert.find({
        symbol,
        alertType: params.alertType,
        enabled: true,
    }).lean();

    let triggeredCount = 0;

    for (const rule of rules) {
        const prev = rule.lastSeenValue ?? null;

        const crossed = didCrossThreshold({
            condition: rule.condition,
            prev,
            current: params.currentValue,
            threshold: rule.threshold,
        });

        const cooldownOk = isCooldownOver({
            lastTriggeredAt: rule.lastTriggeredAt ?? null,
            cooldownMinutes: rule.cooldownMinutes ?? 15,
            now,
        });

        if (crossed && cooldownOk) {
            const cooldownMs = (rule.cooldownMinutes ?? 15) * 60 * 1000;
            const latestAllowed = new Date(now.getTime() - cooldownMs);

            // Atomic guard prevents duplicate triggers (parallel ticks / reconnects)
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
                continue;
            }
        }

        // Not triggered: still update lastSeenValue so crossing works later
        await Alert.updateOne(
            { _id: rule._id },
            { $set: { lastSeenValue: params.currentValue } }
        );
    }

    return { triggered: triggeredCount };
}