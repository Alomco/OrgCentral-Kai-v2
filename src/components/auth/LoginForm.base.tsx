"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { Mail, Lock, Building2, ShieldCheck, Fingerprint, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn } from "../../lib/auth-client";
import { useLoginForm } from "@/hooks/forms/auth/use-login-form";
import { CLASSIFICATION_OPTIONS, RESIDENCY_OPTIONS } from "./LoginForm.constants";
import { CustomSelectField, InputField } from "./LoginForm.fields";


interface LoginFormProps {
    initialOrgSlug?: string;
}

export function LoginForm({ initialOrgSlug }: LoginFormProps) {
    const { values, errors, submitMessage, isSubmitting, handleInputChange, handleCheckboxToggle, handleSubmit } =
        useLoginForm({ initialOrgSlug });

    const [oauthLoading, setOauthLoading] = useState<string | null>(null);

    const handleOAuthSignIn = async (provider: "google" | "microsoft") => {
        setOauthLoading(provider);
        try {
            const orgSlug = values.orgSlug.trim();
            const callbackURL = orgSlug.length > 0
                ? `/api/auth/post-login?org=${encodeURIComponent(orgSlug)}`
                : "/api/auth/post-login";
            await signIn.social({
                provider,
                callbackURL,
            });
        } finally {
            setOauthLoading(null);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* OAuth Buttons */}
            <div className="grid gap-2.5 md:grid-cols-2">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuthSignIn("google")}
                >
                    {oauthLoading === "google" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    Google
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuthSignIn("microsoft")}
                >
                    {oauthLoading === "microsoft" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                            <path fill="#f35325" d="M0 0h11v11H0z" />
                            <path fill="#81bc06" d="M12 0h11v11H12z" />
                            <path fill="#05a6f0" d="M0 12h11v11H0z" />
                            <path fill="#ffba08" d="M12 12h11v11H12z" />
                        </svg>
                    )}
                    Microsoft
                </Button>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                        Or continue with
                    </span>
                </div>
            </div>

            {/* Primary Fields - 2 columns on md+ */}
            <div className="grid gap-3.5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <InputField
                        id="email"
                        type="email"
                        name="email"
                        label="Email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={values.email}
                        error={errors.email}
                        onChange={handleInputChange}
                        icon={<Mail className="h-4 w-4" />}
                    />
                </div>

                <InputField
                    id="password"
                    type="password"
                    name="password"
                    label="Password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={values.password}
                    error={errors.password}
                    onChange={handleInputChange}
                    icon={<Lock className="h-4 w-4" />}
                />

                <InputField
                    id="orgSlug"
                    name="orgSlug"
                    label="Organization"
                    placeholder="your-organization"
                    value={values.orgSlug}
                    error={errors.orgSlug}
                    onChange={handleInputChange}
                    icon={<Building2 className="h-4 w-4" />}
                />
            </div>

            {/* Advanced Options */}
            <details className="group rounded-xl border border-slate-200 bg-linear-to-br from-white to-indigo-50/50 shadow-sm transition-all hover:shadow-md dark:border-slate-700/60 dark:from-slate-800/40 dark:to-indigo-900/10">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400">
                    <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                            <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                        Advanced options
                    </span>
                    <span className="text-xs text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-400">▼</span>
                </summary>
                <div className="grid gap-3.5 border-t border-slate-200 bg-white/60 px-4 pb-3.5 pt-3.5 md:grid-cols-2 dark:border-slate-700/60 dark:bg-slate-900/20">
                    <CustomSelectField
                        id="residency"
                        name="residency"
                        label="Data region"
                        icon={<ShieldCheck className="h-4 w-4" />}
                        value={values.residency}
                        options={RESIDENCY_OPTIONS}
                        error={errors.residency}
                        onValueChange={(value: string) => handleInputChange({ target: { name: "residency", value } } as ChangeEvent<HTMLSelectElement>)}
                    />

                    <CustomSelectField
                        id="classification"
                        name="classification"
                        label="Security level"
                        icon={<Fingerprint className="h-4 w-4" />}
                        value={values.classification}
                        options={CLASSIFICATION_OPTIONS}
                        error={errors.classification}
                        onValueChange={(value: string) => handleInputChange({ target: { name: "classification", value } } as ChangeEvent<HTMLSelectElement>)}
                    />
                </div>
            </details>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                    <Checkbox
                        id="rememberMe"
                        checked={values.rememberMe}
                        onCheckedChange={(checked) => handleCheckboxToggle("rememberMe", Boolean(checked))}
                    />
                    <span className="text-[13px]">Remember me</span>
                </label>
                <Link
                    className="text-[13px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    href="/forgot-password"
                >
                    Forgot password?
                </Link>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 py-5 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 md:py-5.5"
                disabled={isSubmitting}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign in
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </span>
                <div className="absolute inset-0 z-0 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
            </Button>

            {submitMessage ? (
                <p role="status" className="text-center text-sm text-slate-600 dark:text-slate-400">
                    {submitMessage}
                </p>
            ) : null}
        </form>
    );
}

