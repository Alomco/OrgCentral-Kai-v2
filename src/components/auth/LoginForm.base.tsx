"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Building2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn } from "../../lib/auth-client";
import { useLoginForm } from "@/hooks/forms/auth/use-login-form";
import { InputField } from "./LoginForm.fields";
import { OAuthButtons, type Provider } from "./LoginForm.oauth";
import { AdvancedOptions } from "./LoginForm.advanced";


interface LoginFormProps {
    initialOrgSlug?: string;
}

export function LoginForm({ initialOrgSlug }: LoginFormProps) {
    const { values, errors, submitMessage, isSubmitting, handleInputChange, handleCheckboxToggle, handleSubmit } =
        useLoginForm({ initialOrgSlug });

    const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleOAuthSignIn = async (provider: Provider) => {
        setOauthLoading(provider);
        try {
            const nextPath = (() => {
                try {
                    const url = new URL(window.location.href);
                    const next = url.searchParams.get("next");
                    if (typeof next === "string") {
                        const trimmed = next.trim();
                        if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://")) {
                            return trimmed;
                        }
                    }
                    return "/dashboard";
                } catch {
                    return "/dashboard";
                }
            })();

            const orgSlug = values.orgSlug.trim();
            const callbackURL = orgSlug.length > 0
                ? `/api/auth/post-login?next=${encodeURIComponent(nextPath)}&org=${encodeURIComponent(orgSlug)}`
                : `/api/auth/post-login?next=${encodeURIComponent(nextPath)}`;
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
            <OAuthButtons onSignIn={handleOAuthSignIn} loadingProvider={oauthLoading} />

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

            <AdvancedOptions
                values={values}
                errors={errors}
                showAdvanced={showAdvanced}
                onToggle={() => setShowAdvanced((open) => !open)}
                onValueChange={handleInputChange}
            />

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
                    href="mailto:support@orgcentral.test?subject=Password%20help"
                >
                    Need help?
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

