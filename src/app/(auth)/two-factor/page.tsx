import type { Metadata } from "next";

import AuthLayout from "@/components/auth/AuthLayout";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";

export const metadata: Metadata = {
    title: "Two-factor verification • OrgCentral",
    description: "Complete MFA verification to access your OrgCentral workspace.",
};

export default function TwoFactorPage() {
    return (
        <AuthLayout
            title="Verify your identity"
            subtitle="Enter the code from your authenticator app to finish signing in."
        >
            <TwoFactorForm />
        </AuthLayout>
    );
}
