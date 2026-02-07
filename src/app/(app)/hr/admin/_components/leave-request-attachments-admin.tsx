'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AttachmentRecord {
	id: string;
	fileName: string;
	storageKey: string;
	contentType: string;
	fileSize: number;
}

interface Props {
	requestId: string;
}

export function LeaveRequestAttachmentsAdmin({ requestId }: Props) {
	const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const abortController = new AbortController();
		const load = async () => {
			setLoading(true);
			setError(null);
			const res = await fetch(`/api/hr/leave/${requestId}/attachments`, {
				signal: abortController.signal,
			});
			if (!res.ok) {
				throw new Error(await res.text());
			}
			const payload = (await res.json()) as { attachments: AttachmentRecord[] };
			if (!cancelled) { setAttachments(payload.attachments); }
			if (!cancelled) { setLoading(false); }
		};

		load().catch((error: unknown) => {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			if (cancelled) { return; }
			setError(error instanceof Error ? error.message : 'Unable to load attachments');
			setLoading(false);
		});

		return () => {
			cancelled = true;
			abortController.abort();
		};
	}, [requestId]);

	if (loading) { return <span className="text-xs text-muted-foreground">Loading…</span>; }
	if (error) {
		return <span className="text-xs text-destructive line-clamp-2 break-words">{error}</span>;
	}
	if (attachments.length === 0) { return <span className="text-xs text-muted-foreground">None</span>; }

	return (
		<div className="flex flex-wrap gap-2 max-w-[260px]">
			{attachments.map((attachment) => (
				<Badge key={attachment.id} variant="outline" className="flex items-center gap-2">
					<span className="truncate max-w-[140px]" title={attachment.fileName}>{attachment.fileName}</span>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => {
							const downloadWindow = window.open(
								`/api/hr/leave/attachments/${attachment.id}/download`,
								'_blank',
								'noopener,noreferrer',
							);
							if (downloadWindow) {
								downloadWindow.opener = null;
							}
						}}
					>
						Download
					</Button>
				</Badge>
			))}
		</div>
	);
}
