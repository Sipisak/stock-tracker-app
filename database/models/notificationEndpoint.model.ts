import { Schema, model, models, Types } from "mongoose";

export type NotificationChannel = "EMAIL" | "PUSH";

export interface INotificationEndpoint {
    _id: Types.ObjectId;

    userId: string;
    channel: NotificationChannel;

    // EMAIL
    email?: string | null;
    emailVerified?: boolean;

    // PUSH (Web Push subscription object)
    pushSubscription?: Record<string, any> | null;

    // metadata for maintenance/debugging
    userAgent?: string | null;

    enabled: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const NotificationEndpointSchema = new Schema<INotificationEndpoint>(
    {
        userId: { type: String, required: true, index: true },
        channel: { type: String, required: true, enum: ["EMAIL", "PUSH"], index: true },

        email: { type: String, default: null, lowercase: true, trim: true },
        emailVerified: { type: Boolean, default: false },

        pushSubscription: { type: Schema.Types.Mixed, default: null },

        userAgent: { type: String, default: null },

        enabled: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
);

// Common query: "all enabled endpoints for a user"
NotificationEndpointSchema.index({ userId: 1, channel: 1, enabled: 1 });

// For email, avoid duplicates per user
NotificationEndpointSchema.index(
    { userId: 1, channel: 1, email: 1 },
    { unique: true, partialFilterExpression: { channel: "EMAIL", email: { $type: "string" } } }
);

// For push, avoid duplicates per user by endpoint
NotificationEndpointSchema.index(
    { userId: 1, channel: 1, "pushSubscription.endpoint": 1 },
    {
        unique: true,
        partialFilterExpression: {
            channel: "PUSH",
            "pushSubscription.endpoint": { $type: "string" },
        },
    }
);

const NotificationEndpoint =
    models.NotificationEndpoint || model<INotificationEndpoint>("NotificationEndpoint", NotificationEndpointSchema);

export default NotificationEndpoint;
