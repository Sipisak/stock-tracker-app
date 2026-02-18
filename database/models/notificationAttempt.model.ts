import { Schema, model, models, Types } from "mongoose";

export type AttemptStatus = "PENDING" | "SENT" | "FAILED";

export interface INotificationAttempt {
    _id: Types.ObjectId;

    eventId: Types.ObjectId;
    userId: string;

    channel: "EMAIL" | "PUSH";
    endpointId?: Types.ObjectId | null;

    status: AttemptStatus;

    retryCount: number;
    lastError?: string | null;

    providerMessageId?: string | null; // optional (email provider id, etc.)

    createdAt: Date;
    updatedAt: Date;
}

const NotificationAttemptSchema = new Schema<INotificationAttempt>(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "AlertEvent", required: true, index: true },
        userId: { type: String, required: true, index: true },

        channel: { type: String, required: true, enum: ["EMAIL", "PUSH"], index: true },
        endpointId: { type: Schema.Types.ObjectId, ref: "NotificationEndpoint", default: null },

        status: { type: String, required: true, enum: ["PENDING", "SENT", "FAILED"], index: true },

        retryCount: { type: Number, default: 0, min: 0 },
        lastError: { type: String, default: null },

        providerMessageId: { type: String, default: null },
    },
    { timestamps: true }
);

NotificationAttemptSchema.index({ userId: 1, createdAt: -1 });
NotificationAttemptSchema.index({ eventId: 1, channel: 1 });
NotificationAttemptSchema.index({ eventId: 1, channel: 1, status: 1 });

const NotificationAttempt =
    models.NotificationAttempt || model<INotificationAttempt>("NotificationAttempt", NotificationAttemptSchema);

export default NotificationAttempt;

