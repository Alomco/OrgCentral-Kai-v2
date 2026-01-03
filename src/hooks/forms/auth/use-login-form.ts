"use client";

import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { LoginActionInput } from "@/features/auth/login/login-contracts";
import type { LoginFieldErrors } from "./login-form-errors";
import { authClient } from "@/lib/auth-client";

export type ResidencyZoneOption = "UK_ONLY" | "UK_AND_EEA" | "GLOBAL_RESTRICTED";
export type ClassificationLevelOption = "PUBLIC" | "OFFICIAL" | "OFFICIAL_SENSITIVE";

export interface LoginFormValues {
    email: string;
    password: string;
    orgSlug: string;
    residency: ResidencyZoneOption;
    classification: ClassificationLevelOption;
    rememberMe: boolean;
}

export interface UseLoginFormOptions {
    initialOrgSlug?: string;
    initialResidency?: ResidencyZoneOption;
    initialClassification?: ClassificationLevelOption;
}

export interface UseLoginFormResult {
    values: LoginFormValues;
    errors: LoginFieldErrors;
    submitMessage: string | null;
    isSubmitting: boolean;
    handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleCheckboxToggle: (field: "rememberMe", checked: boolean) => void;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const DEFAULT_VALUES: LoginFormValues = {
    email: "",
    password: "",
    orgSlug: "",
    residency: "UK_ONLY",
    classification: "OFFICIAL",
    rememberMe: true,
};

function sanitize(values: LoginFormValues): LoginFormValues {
    return {
        ...values,
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
        orgSlug: values.orgSlug.trim(),
    };
}

function isFormIncomplete(values: LoginFormValues): boolean {
    return !values.email || !values.password || !values.orgSlug;
}

function resolveNextPathFromLocation(): string {
    try {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next");
        if (typeof next === "string" && next.trim().startsWith("/")) {
            return next.trim();
        }
    } catch {
        // ignore
    }

    return "/dashboard";
}

export function useLoginForm(options?: UseLoginFormOptions): UseLoginFormResult {
    const [values, setValues] = useState<LoginFormValues>({
        ...DEFAULT_VALUES,
        orgSlug: options?.initialOrgSlug ?? DEFAULT_VALUES.orgSlug,
        residency: options?.initialResidency ?? DEFAULT_VALUES.residency,
        classification: options?.initialClassification ?? DEFAULT_VALUES.classification,
    });
    const [errors, setErrors] = useState<LoginFieldErrors>({});
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const memoizedValues = useMemo(() => sanitize(values), [values]);

    const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setValues((previous) => ({ ...previous, [name]: value }));
    }, []);

    const handleCheckboxToggle = useCallback((field: "rememberMe", checked: boolean) => {
        setValues((previous) => ({ ...previous, [field]: checked }));
    }, []);

    const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const submit = async (): Promise<void> => {
            setSubmitMessage(null);
            setErrors({});

            if (isFormIncomplete(memoizedValues)) {
                setSubmitMessage("Please complete every required field.");
                return;
            }

            const payload: LoginActionInput = {
                ...memoizedValues,
                userAgent: window.navigator.userAgent,
            };

            setIsSubmitting(true);
            try {
                const nextPath = resolveNextPathFromLocation();
                const callbackURL = `/api/auth/post-login?next=${encodeURIComponent(nextPath)}&org=${encodeURIComponent(payload.orgSlug)}`;

                const { data, error } = await authClient.signIn.email({
                    email: payload.email,
                    password: payload.password,
                    rememberMe: payload.rememberMe,
                    callbackURL,
                });

                if (error) {
                    setSubmitMessage(typeof error.message === "string" ? error.message : "Unable to sign in.");
                    return;
                }

                const redirectUrl = typeof data.url === "string" && data.url.length > 0 ? data.url : callbackURL;

                setSubmitMessage("Login successful. Redirecting you now…");
                window.location.assign(redirectUrl);
            } catch {
                setSubmitMessage("We could not reach the authentication service. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        };

        void submit().catch(() => {
            setSubmitMessage("We could not reach the authentication service. Please try again.");
            setIsSubmitting(false);
        });
    }, [memoizedValues]);

    return {
        values,
        errors,
        submitMessage,
        isSubmitting,
        handleInputChange,
        handleCheckboxToggle,
        handleSubmit,
    };
}
