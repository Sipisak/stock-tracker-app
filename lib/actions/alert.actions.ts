'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Alert, IAlert } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import AlertEvent from "@/database/models/alertEvent.models";

export const createAlert = async (data: AlertFormData & {symbol :string; company: string; }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');
    try {

        await connectToDatabase();

        const newAlert = new Alert({
            ...data,
            userId: session.user.id,
        });

        const MAX_ALERTS = 50;
        const currentAlertsCount = await Alert.countDocuments({ userId: session.user.id });

        if (currentAlertsCount >= MAX_ALERTS) {
            throw new Error(`Dosažen limit! Můžeš mít maximálně ${MAX_ALERTS} aktivních alertů.`);
        }

        await newAlert.save();

        revalidatePath('/watchlist');
        return { success: true, data: JSON.parse(JSON.stringify(newAlert)) };
    } catch (error) {
        console.error('Error creating alert:', error);
        throw new Error('Failed to create alert');
    }
};

export const getAlertsForUser = async (): Promise<IAlert[]> => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return [];

        await connectToDatabase();

        const alerts = await Alert.find({ userId: session.user.id, enabled: true }).sort({ createdAt: -1 }).lean();

        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
};

export const deleteAlert = async (alertId: string) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');
    try {

        await connectToDatabase();

        const result = await Alert.deleteOne({ _id: alertId, userId: session.user.id });

        if (result.deletedCount === 0) {
            return { success: false, error: 'Alert not found or you do not have permission to delete it.' };
        }

        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error deleting alert:', error);
        throw new Error('Failed to delete alert');
    }
};

export async function updateAlert(alertId: string, alertData: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error('Unauthorized');

        await connectToDatabase();

        // Updatneme alert a vyresetujeme historii, aby se mohl spustit znovu
        const updatedAlert = await Alert.findOneAndUpdate(
            { _id: alertId, userId: session.user.id }, // Pojistka: musí to být jeho alert!
            {
                $set: {
                    alertType: alertData.alertType,
                    condition: alertData.condition,
                    threshold: Number(alertData.threshold),
                    lastTriggeredAt: null, // Reset cooldownu
                    lastSeenValue: null    // Reset minulé ceny
                }
            },
            { new: true }
        );

        if (!updatedAlert) throw new Error("Alert nenalezen");

        revalidatePath('/watchlist'); // nebo cesta, kde máš alerty zobrazené
        return JSON.parse(JSON.stringify(updatedAlert));
    } catch (error) {
        console.error('Chyba při updatu alertu:', error);
        throw error;
    }
}


export async function getUserAlertHistory() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error('Unauthorized');

        await connectToDatabase();

        // Vytáhne posledních 50 spuštěných alertů
        const history = await AlertEvent.find({ userId: session.user.id })
            .sort({ triggeredAt: -1 }) // Od nejnovějších
            .limit(50)
            .lean();

        return JSON.parse(JSON.stringify(history));
    } catch (error) {
        console.error('Chyba při načítání historie:', error);
        return [];
    }
}