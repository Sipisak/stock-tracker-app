import mongoose, { Document, Schema } from "mongoose";

export type AlertType = "price" | "percent" | "volume";
export type AlertCondition = "upper" | "lower";

export interface IAlert extends Document {
    userId: string;
    symbol: string;
    company: string;

    alertType: AlertType;
    threshold: number;
    condition: AlertCondition;

    enabled: boolean;

    // reliability / correctness
    cooldownMinutes: number;
    lastTriggeredAt?: Date | null;
    lastSeenValue?: number | null;

    createdAt: Date;
    updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
        company: { type: String, required: true },

        alertType: { type: String, enum: ["price", "percent", "volume"], required: true },
        threshold: { type: Number, required: true },
        condition: { type: String, enum: ["upper", "lower"], required: true },

        enabled: { type: Boolean, default: true, index: true },

        cooldownMinutes: { type: Number, default: 15, min: 0 },
        lastTriggeredAt: { type: Date, default: null },
        lastSeenValue: { type: Number, default: null },
    },
    { timestamps: true }
);

// Query patterns
AlertSchema.index({ userId: 1, enabled: 1, createdAt: -1 });
AlertSchema.index({ symbol: 1, enabled: 1 });

// Prevent accidental duplicate rules (optional but nice)
AlertSchema.index(
    { userId: 1, symbol: 1, alertType: 1, condition: 1, threshold: 1 },
    { unique: true }
);

export const Alert = mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
