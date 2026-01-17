"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";

const DEFAULT_TWO_FACTOR_PATH = "/two-factor";

function resolveTwoFactorRedirectUrl(): string {
    if (typeof window === "undefined") {
        return DEFAULT_TWO_FACTOR_PATH;
    }

    const currentUrl = new URL(window.location.href);
    const params = new URLSearchParams();
    const nextPath = currentUrl.searchParams.get("next");
    const orgSlug = currentUrl.searchParams.get("org");

    if (typeof nextPath === "string" && nextPath.trim().startsWith("/")) {
        params.set("next", nextPath.trim());
    }

    if (typeof orgSlug === "string" && orgSlug.trim().length > 0) {
        params.set("org", orgSlug.trim());
    }

    const query = params.toString();
    return query.length > 0 ? `${DEFAULT_TWO_FACTOR_PATH}?${query}` : DEFAULT_TWO_FACTOR_PATH;
}

export const authClient = createAuthClient({
    plugins: [
        organizationClient(),
        twoFactorClient({
            onTwoFactorRedirect() {
                window.location.href = resolveTwoFactorRedirectUrl();
            },
        }),
    ],
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
} = authClient;
