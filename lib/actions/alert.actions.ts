'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Alert, IAlert } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const createAlert = async (data: AlertFormData & {symbol :string; company: string; }) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) redirect('/sign-in');

        await connectToDatabase();

        const newAlert = new Alert({
            ...data,
            userId: session.user.id,
            status: 'active',
        });

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

        const alerts = await Alert.find({ userId: session.user.id, status: 'active' }).sort({ createdAt: -1 }).lean();

        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
};

export const deleteAlert = async (alertId: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) redirect('/sign-in');

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