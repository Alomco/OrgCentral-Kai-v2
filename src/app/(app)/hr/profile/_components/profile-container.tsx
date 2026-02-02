"use client";

import { useState, useCallback, useId, useEffect } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Modal,
    ModalContent,
    ModalClose,
    ModalDescription,
    ModalHeader,
    ModalTitle,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

import type { EmployeeProfile } from '@/server/types/hr-types';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { ProfileHero } from './profile-hero';
import { ProfileBentoGrid } from './profile-bento-grid';
import { ProfileDetailsSection } from './profile-details-section';
import { ProfileEditForm } from './profile-edit-form';
import { ProfilePermissionsCard } from './profile-permissions-card';
import { buildInitialSelfProfileFormState } from '../form-state';

interface ProfileContainerProps {
    profile: EmployeeProfile;
    authorization: RepositoryAuthorizationContext;
    userImage?: string | null;
}

export function ProfileContainer({ profile, authorization, userImage }: ProfileContainerProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const formId = useId();

    const handleOpenEdit = useCallback(() => {
        setIsEditOpen(true);
    }, []);

    const handleCloseEdit = useCallback(() => {
        setIsEditOpen(false);
    }, []);

    useEffect(() => {
        if (!isEditOpen || typeof document === 'undefined') {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isEditOpen]);

    return (
        <>
            <ProfileHero
                profile={profile}
                userImage={userImage}
                onEdit={handleOpenEdit}
            />

            <div className="mt-8">
                <Tabs defaultValue="overview" className="w-full space-y-6">
                    <TabsList className="bg-transparent p-0 border-b border-[oklch(var(--border)/var(--ui-border-opacity))] rounded-none w-full justify-start h-auto">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none hover:text-foreground transition-colors"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="details"
                            className="rounded-none border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none hover:text-foreground transition-colors"
                        >
                            Personal Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="access"
                            className="rounded-none border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none hover:text-foreground transition-colors"
                        >
                            Access & Permissions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ProfileBentoGrid profile={profile} />
                    </TabsContent>

                    <TabsContent value="details" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ProfileDetailsSection profile={profile} />
                    </TabsContent>

                    <TabsContent value="access" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ProfilePermissionsCard authorization={authorization} profile={profile} />
                    </TabsContent>
                </Tabs>
            </div>

            <Modal open={isEditOpen} onOpenChange={setIsEditOpen} modal>
                <ModalContent
                    side="center"
                    className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[oklch(var(--border)/0.7)] bg-[oklch(var(--popover)/1)] shadow-[0_24px_64px_-28px_rgba(0,0,0,0.55)]"
                    bodyClassName="gap-0 overflow-hidden"
                >
                    <ModalHeader className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[oklch(var(--border)/0.65)] bg-[oklch(var(--popover)/1)] px-6 py-5 backdrop-blur-md">
                        <div className="space-y-1">
                            <ModalTitle className="text-xl leading-tight">Edit Profile</ModalTitle>
                            <ModalDescription>
                                Update your personal information and preferences.
                            </ModalDescription>
                        </div>
                        <ModalClose asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Close edit profile dialog"
                            >
                                <XIcon className="h-4 w-4" />
                            </Button>
                        </ModalClose>
                    </ModalHeader>
                    <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
                        <ProfileEditForm
                            key={isEditOpen ? 'open' : 'closed'}
                            formId={formId}
                            initialState={buildInitialSelfProfileFormState(profile)}
                            onCancel={handleCloseEdit}
                            onSuccess={handleCloseEdit}
                        />
                    </div>
                </ModalContent>
            </Modal>
        </>
    );
}
