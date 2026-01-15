import { Circle, CircleDashed, Accessibility, Contrast, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

interface AccessibilityStatusIndicatorProps {
    status: 'compliant' | 'needs-improvement' | 'non-compliant';
    level?: 'aa' | 'aaa';
    className?: string;
}

export function AccessibilityStatusIndicator({ status, level = 'aa', className }: AccessibilityStatusIndicatorProps) {
    const statusConfig = {
        compliant: { 
            icon: Circle, 
            color: 'text-green-500', 
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        'needs-improvement': { 
            icon: CircleDashed, 
            color: 'text-amber-500', 
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20'
        },
        'non-compliant': { 
            icon: Accessibility, 
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
            <span className={config.color}>
                {status === 'compliant' ? 'WCAG 2.2 ' + level.toUpperCase() : 
                 status === 'needs-improvement' ? 'Needs Improvement' : 'Non-Compliant'}
            </span>
        </div>
    );
}

interface AccessibilityToggleProps {
    onToggle: () => void;
    isEnabled: boolean;
    className?: string;
}

export function AccessibilityToggle({ onToggle, isEnabled, className }: AccessibilityToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isEnabled 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70 border border-border/30",
                className
            )}
            aria-pressed={isEnabled}
            aria-label={isEnabled ? "Disable accessibility enhancements" : "Enable accessibility enhancements"}
        >
            <Accessibility className="h-4 w-4" />
            <span>Accessibility Mode</span>
        </button>
    );
}

interface ContrastToggleProps {
    onToggle: () => void;
    isEnabled: boolean;
    className?: string;
}

export function ContrastToggle({ onToggle, isEnabled, className }: ContrastToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isEnabled 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70 border border-border/30",
                className
            )}
            aria-pressed={isEnabled}
            aria-label={isEnabled ? "Disable high contrast mode" : "Enable high contrast mode"}
        >
            {isEnabled ? <Contrast className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{isEnabled ? "High Contrast" : "Normal Contrast"}</span>
        </button>
    );
}