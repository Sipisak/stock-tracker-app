import { Schema, model, models, Types } from "mongoose";

export interface IAlertEvent {
    _id: Types.ObjectId;

    ruleId: Types.ObjectId;
    userId: string;

    symbol: string;
    condition: "ABOVE" | "BELOW";
    threshold: number;

    triggerPrice: number;
    triggeredAt: Date;

    // Helps with dedupe + debugging
    reason?: string | null;

    createdAt: Date;
    updatedAt: Date;
}

const AlertEventSchema = new Schema<IAlertEvent>(
    {
        ruleId: { type: Schema.Types.ObjectId, ref: "AlertRule", required: true, index: true },
        userId: { type: String, required: true, index: true },

        symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
        condition: { type: String, required: true, enum: ["ABOVE", "BELOW"] },
        threshold: { type: Number, required: true },

        triggerPrice: { type: Number, required: true },
        triggeredAt: { type: Date, required: true, index: true },

        reason: { type: String, default: null },
    },
    { timestamps: true }
);

AlertEventSchema.index({ userId: 1, triggeredAt: -1 });
AlertEventSchema.index({ symbol: 1, triggeredAt: -1 });

const AlertEvent = models.AlertEvent || model<IAlertEvent>("AlertEvent", AlertEventSchema);
export default AlertEvent;
