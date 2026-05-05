'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {signInWithEmail, signUpWithEmail} from "@/lib/actions/auth.actions";
import Link from "next/link";
import {toast} from "sonner";
import {signInEmail} from "better-auth/api";
import {useRouter} from "next/navigation";
import {signIn} from "@/lib/better-auth/client";

const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if (result.success) {
                router.push('/');
            } else if (result.error) {
                toast.error('Sign in failed', { description: result.error });
            }
        } catch (e) {
            console.error(e);
            toast.error('Sign in failed', {
                description: e instanceof Error ? e.message : 'Failed to sign in.'
            })
        }
    }


    const handleMicrosoftLogin = async () => {
        try {
            await signIn.social({
                provider: "microsoft",
                callbackURL: "/",
            });
        } catch (e) {
            toast.error("Error redirecting to Microsoft.");
        }
    };

    return (
        <>
            <h1 className="form-title">Welcome back</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@test.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' } }}
                />

                <div className="space-y-2">
                    <InputField
                        name="password"
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        register={register}
                        error={errors.password}
                        validation={{ required: 'Password is required', minLength: 8 }}
                    />
                    <div className="text-right">
                        <Link href="/forgot-password" className="text-sm font-medium text-yellow-400 hover:text-yellow-500 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full">
                    {isSubmitting ? 'Signing In' : 'Sign In'}
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    variant="outline"
                    className="w-full h-12 border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                    Microsoft 365
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
