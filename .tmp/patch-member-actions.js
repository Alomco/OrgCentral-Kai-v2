const fs=require('fs');
const p='src/app/(app)/org/members/_components/member-actions.tsx';
let s=fs.readFileSync(p,'utf8');
if(!s.includes('removeFromOrg')){
  const marker='const canResume = props.status === \u0027SUSPENDED\u0027;';
  const inject=`\n\n    const removeFromOrg = useMutation({\n        mutationFn: async (): Promise<undefined> => {\n            await updateMember(props.orgId, props.userId, { status: 'SUSPENDED' as any });\n            return undefined;\n        },\n        onMutate: async () => {\n            if (!props.currentQueryKey) return { previous: undefined } as { previous?: any };\n            await queryClient.cancelQueries({ queryKey: memberKeys.list(props.orgId, props.currentQueryKey) });\n            const key = memberKeys.list(props.orgId, props.currentQueryKey);\n            const previous = queryClient.getQueryData<any>(key);\n            if (previous && Array.isArray(previous.users)) {\n                queryClient.setQueryData(key, (old: any) => ({ ...old, users: (old.users as any[]).filter((u) => u.id !== props.userId) }));\n            }\n            return { previous } as { previous?: any };\n        },\n        onError: (_err, _vars, context) => {\n            if (context?.previous && props.currentQueryKey) {\n                queryClient.setQueryData(memberKeys.list(props.orgId, props.currentQueryKey), context.previous);\n            }\n        },\n        onSettled: async () => {\n            if (props.currentQueryKey) {\n                await queryClient.invalidateQueries({ queryKey: memberKeys.list(props.orgId, props.currentQueryKey) });\n            }\n        },\n    });\n`;
  s=s.replace(marker, marker+inject);
}
if(!s.includes('Remove from org')){
  s=s.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, `</div>\n\n            <form action={() => removeFromOrg.mutate()}>\n                <button type=\"submit\" disabled={removeFromOrg.isPending} className=\"h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70\">\n                    ${'${removeFromOrg.isPending ? \'Removing…\' : \'Remove from org\'}'}\n                </button>\n            </form>\n            {removeFromOrg.isError ? (\n                <p className=\"text-xs text-[oklch(var(--muted-foreground))]\">Unable to remove.</p>\n            ) : null}\n        </div>\n    </div>\n    );\n}\n`);
}
fs.writeFileSync(p,s);
console.log('patched member-actions');
