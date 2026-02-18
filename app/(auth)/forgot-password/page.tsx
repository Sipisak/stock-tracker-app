'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { toast } from "sonner";
import { useState } from 'react';
import { sendPasswordResetEmail } from '@/lib/actions/auth.actions';

type ForgotPasswordFormData = {
    email: string;
}

const ForgotPassword = () => {
    const [submitted, setSubmitted] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        await sendPasswordResetEmail(data.email);
        toast.success('If an account with this email exists, a reset link has been sent.');
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="flex flex-col gap-5 text-center">
                <h1 className="form-title">Check your inbox</h1>
                <p className="text-gray-400">
                    A password reset link has been sent to your email address if an account exists. Please check your spam folder if you don't see it.
                </p>
                <FooterLink text="Remembered your password?" linkText="Sign in" href="/sign-in" />
            </div>
        )
    }

    return (
        <>
            <h1 className="form-title">Forgot Password</h1>
            <p className="text-gray-400 mb-8">
                No problem! Enter your email address below and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full">
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <FooterLink text="Remembered your password?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    );
};
export default ForgotPassword;