import type { ClassificationLevelOption, ResidencyZoneOption } from "@/hooks/forms/auth/use-login-form";

export const RESIDENCY_OPTIONS: { value: ResidencyZoneOption; label: string }[] = [
    { value: "UK_ONLY", label: "UK Only" },
    { value: "UK_AND_EEA", label: "UK + EEA" },
    { value: "GLOBAL_RESTRICTED", label: "Global" },
];

export const CLASSIFICATION_OPTIONS: { value: ClassificationLevelOption; label: string }[] = [
    { value: "PUBLIC", label: "Public" },
    { value: "OFFICIAL", label: "Official" },
    { value: "OFFICIAL_SENSITIVE", label: "Sensitive" },
];
