"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, Edit, KeyRound, ShieldCheck } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CyberGridPattern, MeshGradientPattern } from '@/assets/profile-patterns';
import type { EmployeeProfile } from '@/server/types/hr-types';

interface ProfileHeroProps {
    profile: EmployeeProfile;
    className?: string;
    onEdit?: () => void;
    userImage?: string | null;
}

export function ProfileHero({ profile, className, onEdit, userImage }: ProfileHeroProps) {
    const firstName = profile.firstName ?? '';
    const lastName = profile.lastName ?? '';
    const initials = (firstName && lastName)
        ? `${firstName.charAt(0)}${lastName.charAt(0)}`
        : (profile.displayName ?? 'ME').slice(0, 2).toUpperCase();
    const fullName = profile.displayName ?? 'Unnamed Employee';

    return (
        <div
            className={cn('relative w-full overflow-hidden group/hero', className)}
            data-ui-surface="container"
        >
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 z-0">
                <MeshGradientPattern />
                <CyberGridPattern className="text-[hsl(var(--primary))] opacity-20" />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-[hsl(var(--card)/0.6)] to-[hsl(var(--card))]" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center gap-6 p-8 md:flex-row md:items-end md:justify-between md:gap-10">

                {/* Avatar Group */}
                <div className="group relative">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[hsl(var(--background))] shadow-xl ring-2 ring-[hsl(var(--primary)/0.3)] transition-all duration-500 hover:scale-105 hover:ring-[hsl(var(--primary)/0.8)]">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={profile.photoUrl ?? userImage ?? undefined} alt={fullName} className="object-cover" />
                            <AvatarFallback className="bg-linear-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--accent)/0.2)] text-3xl font-bold text-gradient-theme">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white" onClick={onEdit}>
                                <Camera className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--background))] shadow-sm">
                        <div className="h-4 w-4 rounded-full bg-green-500 ring-2 ring-green-500/30 animate-pulse" />
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-3 md:justify-start">
                            <motion.h1
                                className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span className="bg-linear-to-r from-[hsl(var(--foreground))] via-[hsl(var(--foreground)/0.8)] to-[hsl(var(--foreground)/0.5)] bg-clip-text text-transparent">
                                    {fullName}
                                </span>
                            </motion.h1>
                            {/* Verified Badge */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="secondary"
                                            className="h-7 gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5" /> Verified
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Identity verified by Organization</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <motion.p
                            className="text-lg font-semibold text-foreground/80"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {profile.jobTitle ?? 'Team Member'}
                        </motion.p>

                        <motion.div
                            className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-foreground/80 md:justify-start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">{profile.departmentId ?? 'General'}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground/90">{profile.email ?? 'Email not set'}</span>
                        </motion.div>
                    </div>
                </div>

                {/* Hero Actions */}
                <motion.div
                    className="flex shrink-0 items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Button
                        asChild
                        variant="secondary"
                        size="lg"
                        className="gap-2"
                    >
                        <Link href="/two-factor/setup">
                            <KeyRound className="h-4 w-4" />
                            Set up MFA
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="glass-cta gap-2 border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] hover:border-[hsl(var(--primary)/0.4)]"
                        onClick={onEdit}
                    >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
