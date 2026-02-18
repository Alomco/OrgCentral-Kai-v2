"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const OTP_LENGTH = 6;
const DEFAULT_NEXT_PATH = "/dashboard";
const LOGIN_PATH = "/login";

function resolveNextPath(): string {
    if (typeof window === "undefined") {
        return DEFAULT_NEXT_PATH;
    }

    const url = new URL(window.location.href);
    const nextValue = url.searchParams.get("next");

    if (typeof nextValue === "string") {
        const trimmed = nextValue.trim();
        if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://")) {
            return trimmed;
        }
    }

    return DEFAULT_NEXT_PATH;
}

function resolveOrgSlug(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    const url = new URL(window.location.href);
    const orgValue = url.searchParams.get("org");
    if (typeof orgValue === "string" && orgValue.trim().length > 0) {
        return orgValue.trim();
    }

    return null;
}

function buildPostLoginRedirect(): string {
    const params = new URLSearchParams();
    params.set("next", resolveNextPath());

    const orgSlug = resolveOrgSlug();
    if (orgSlug) {
        params.set("org", orgSlug);
    }

    return `/api/auth/post-login?${params.toString()}`;
}

function buildLoginLink(): string {
    const params = new URLSearchParams();
    const nextPath = resolveNextPath();
    const orgSlug = resolveOrgSlug();

    if (nextPath) {
        params.set("next", nextPath);
    }

    if (orgSlug) {
        params.set("org", orgSlug);
    }

    const query = params.toString();
    return query.length > 0 ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}

export function TwoFactorForm({
    variant = "page",
    disableRedirect = false,
    onVerified,
}: {
    variant?: "page" | "modal";
    disableRedirect?: boolean;
    onVerified?: () => void | Promise<void>;
}) {
    const [code, setCode] = useState("");
    const [trustDevice, setTrustDevice] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isModal = variant === "modal";

    const normalizedCode = useMemo(() => code.replace(/\s+/g, ""), [code]);
    const isCodeComplete = normalizedCode.length === OTP_LENGTH;

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setStatusMessage(null);

        if (!isCodeComplete) {
            setStatusMessage("Enter the 6-digit code from your authenticator app.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({
                code: normalizedCode,
                trustDevice,
            });

            if (error) {
                setStatusMessage(typeof error.message === "string" ? error.message : "Invalid code.");
                return;
            }

            if (disableRedirect) {
                setStatusMessage("Verification successful.");
                if (onVerified) {
                    await onVerified();
                }
                return;
            }

            setStatusMessage("Verification successful. Redirecting...");

            if (onVerified) {
                await onVerified();
            }
            window.location.assign(buildPostLoginRedirect());
        } catch {
            setStatusMessage("We could not verify that code. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [disableRedirect, isCodeComplete, normalizedCode, onVerified, trustDevice]);

    return (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div
                className={
                    isModal
                        ? "rounded-xl border border-border/70 bg-card/80 p-4"
                        : "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60"
                }
            >
                <div className="flex items-start gap-3">
                    <span
                        className={
                            isModal
                                ? "flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                : "flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200"
                        }
                    >
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Two-factor verification
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Enter the 6-digit code from your authenticator app to continue.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <InputOTP
                    value={code}
                    onChange={setCode}
                    maxLength={OTP_LENGTH}
                    containerClassName="w-full justify-center"
                    className="justify-center"
                    aria-label="Two-factor authentication code"
                >
                    <InputOTPGroup>
                        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
                <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Checkbox
                            id="trustDevice"
                            checked={trustDevice}
                            onCheckedChange={(checked) => setTrustDevice(Boolean(checked))}
                        />
                        <span className="text-[13px]">Trust this device for 30 days</span>
                    </label>
                    <Link
                        className={
                            isModal
                                ? "text-[13px] font-semibold text-primary transition-colors hover:text-primary/80"
                                : "text-[13px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                        }
                        href={buildLoginLink()}
                    >
                        Use another account
                    </Link>
                </div>
            </div>

            <Button
                type="submit"
                className={
                    isModal
                        ? "group relative w-full overflow-hidden rounded-lg bg-primary py-4 text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-50"
                        : "group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 py-5 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100 md:py-5.5"
                }
                disabled={!isCodeComplete || isSubmitting}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        <>
                            Verify and continue
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </span>
                {isModal ? null : (
                    <div className="absolute inset-0 z-0 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                )}
            </Button>

            {statusMessage ? (
                <p role="status" className="text-center text-sm text-slate-600 dark:text-slate-400">
                    {statusMessage}
                </p>
            ) : null}
        </form>
    );
}
