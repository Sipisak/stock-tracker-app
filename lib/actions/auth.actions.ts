'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            })
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        if (e instanceof Error && (e.message.includes('User with this email already exists') || e.message.includes('User already exists'))) {
            return { success: false, error: 'A user with this email already exists.' };
        }

        return { success: false, error: 'An unknown error occurred during sign up.' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        if (e instanceof Error && e.message.includes('Invalid credentials')) {
            return { success: false, error: 'Invalid email or password. Please try again.' };
        }

        return { success: false, error: 'An unknown error occurred during sign in.' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}

export const sendPasswordResetEmail = async (email: string) => {
    try {
        await auth.api.sendPasswordResetEmail({ body: { email } });
        return { success: true };
    } catch (e) {
        console.error('Failed to send password reset email', e);
        // For security, we don't want to reveal if an email is registered or not.
        // So we return a generic success-like message.
        return { success: true };
    }
}
