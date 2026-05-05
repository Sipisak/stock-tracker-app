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
            // 1. Zavoláme standardní Better Auth API endpoint
            const response = await fetch("/api/auth/sign-in/social", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    provider: "microsoft",
                    callbackURL: "/", // Kam se vrátit po úspěchu
                }),
            });

            const data = await response.json();

            // 2. Pokud backend správně vygeneroval Microsoft URL, přesměrujeme tam uživatele
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Nepodařilo se vygenerovat přihlašovací odkaz.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Chyba při komunikaci s přihlašovacím serverem.");
        }
    };

    return (
        <>
            <h1 className="form-title">Welcome back</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
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

                {/* 👇 VIZUÁLNÍ ODDĚLOVAČ */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                </div>

                {/* 👇 MICROSOFT TLAČÍTKO */}
                <Button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    variant="outline"
                    className="w-full h-12 border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/Plan/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                    Microsoft 365
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
