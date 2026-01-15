import { ShieldAlert, ShieldCheck, ShieldHalf, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SecurityStatusIndicatorProps {
    status: 'secure' | 'warning' | 'critical';
    label: string;
    className?: string;
}

export function SecurityStatusIndicator({ status, label, className }: SecurityStatusIndicatorProps) {
    const statusConfig = {
        secure: {
            icon: ShieldCheck,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        warning: {
            icon: ShieldHalf,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20'
        },
        critical: {
            icon: ShieldAlert,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            borderColor: 'border-destructive/20'
        }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            config.bgColor,
            config.borderColor,
            "border",
            className
        )}>
            <Icon className={cn("h-3.5 w-3.5", config.color)} aria-hidden="true" />
            <span className={config.color}>{label}</span>
        </div>
    );
}

interface SecureDataDisplayProps {
    children: ReactNode;
    label: string;
    isSensitive?: boolean;
    className?: string;
}

export function SecureDataDisplay({ children, label, isSensitive = false, className }: SecureDataDisplayProps) {
    const [isVisible, setIsVisible] = useState(!isSensitive);

    return (
        <div className={cn("space-y-1", className)}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                </label>
                {isSensitive && (
                    <button
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        className="text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1.5"
                        aria-label={isVisible ? "Hide sensitive data" : "Show sensitive data"}
                    >
                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                )}
            </div>
            <div className={cn(
                "text-sm font-mono rounded px-3 py-2 bg-secondary/30 border border-border/30",
                isVisible ? "text-foreground" : "blur-sm select-none"
            )}>
                {isVisible ? children : "••••••••••••••••"}
            </div>
        </div>
    );
}

interface ComplianceBadgeProps {
    standard: 'iso27001' | 'soc2' | 'gdpr' | 'hipaa' | 'pci';
    compliant: boolean;
    className?: string;
}

export function ComplianceBadge({ standard, compliant, className }: ComplianceBadgeProps) {
    const standardLabels = {
        iso27001: "ISO 27001",
        soc2: "SOC 2",
        gdpr: "GDPR",
        hipaa: "HIPAA",
        pci: "PCI DSS"
    };

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            compliant
                ? "bg-green-500/10 text-green-700 border border-green-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20",
            className
        )}>
            <Lock className={cn("h-3 w-3", compliant ? "text-green-600" : "text-destructive")} />
            <span>{standardLabels[standard]}</span>
            {compliant ? (
                <ShieldCheck className="h-3 w-3 text-green-600" />
            ) : (
                <ShieldAlert className="h-3 w-3 text-destructive" />
            )}
        </div>
    );
}