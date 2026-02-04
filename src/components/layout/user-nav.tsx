'use client';

import { LogOut, User, Settings, Shield, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import type { AuthSession } from '@/server/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { authClient } from '@/lib/auth-client';
import { hasPermission } from '@/lib/security/permission-check';

interface UserNavProps {
    session: NonNullable<AuthSession>;
    authorization: RepositoryAuthorizationContext;
}

function getUserInitials(name: string | null | undefined, email: string): string {
    if (name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
}

export function UserNav({ session, authorization }: UserNavProps) {
    const userEmail = typeof session.user.email === 'string' ? session.user.email : 'User';
    const userName = session.user.name || userEmail;
    const userInitials = getUserInitials(session.user.name, userEmail);
    const isAdmin = hasPermission(authorization.permissions, 'organization', 'update');

    const handleSignOut = async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = '/login';
                    },
                    onError: () => {
                        // Sign out error, redirect to login
                        window.location.href = '/login';
                    },
                },
            });
        } catch {
            // Sign out failed, redirect to login anyway
            window.location.href = '/login';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:shadow-md"
                >
                    <Avatar className="h-10 w-10 ring-1 ring-border/40 transition-all duration-300 hover:ring-primary/50">
                        <AvatarImage src={session.user.image ?? undefined} alt={userName} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold shadow-sm">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 border border-border/60 bg-popover text-popover-foreground shadow-lg"
                align="end"
                sideOffset={8}
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2 p-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={session.user.image ?? undefined} alt={userName} />
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-base">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1 flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-none truncate">
                                    {userName}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground truncate">{userEmail}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/50 px-2 py-1.5">
                            <span className="text-xs font-medium text-muted-foreground">Role:</span>
                            <span className="text-xs font-semibold text-foreground">
                                {authorization.roleKey}
                            </span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-muted/60">
                        <Link href="/hr/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-muted/60">
                        <Link href="/settings/security" className="flex items-center">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Security & Account</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-muted/60">
                        <Link href="/org/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    {isAdmin ? (
                        <DropdownMenuItem asChild className="cursor-pointer transition-all duration-200 hover:bg-muted/60">
                            <Link href="/admin" className="flex items-center">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Admin Portal</span>
                            </Link>
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive transition-colors"
                    onSelect={async (event) => {
                        event.preventDefault();
                        await handleSignOut();
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
