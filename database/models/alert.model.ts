import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
    id: string;
    userId: string;
    symbol: string;
    company: string;
    alertType: 'price' | 'percent' | 'volume';
    threshold: number;
    condition: 'upper' | 'lower';
    status: 'active' | 'triggered';
    createdAt: Date;
    triggeredAt?: Date;
}

const AlertSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    company: { type: String, required: true },
    alertType: { type: String, enum: ['price', 'percent', 'volume'], required: true },
    threshold: { type: Number, required: true },
    condition: { type: String, enum: ['upper', 'lower'], required: true },
    status: { type: String, enum: ['active', 'triggered'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    triggeredAt: { type: Date },
});

export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);