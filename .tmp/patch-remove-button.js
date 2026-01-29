const fs=require('fs');
const p='src/app/(app)/org/members/_components/member-actions.tsx';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/\n\s*<form action=\{\(\) => removeFromOrg\.mutate\(\)\}>[\s\S]*?<\/form>/, `\n                <button type=\"button\" onClick={() => removeFromOrg.mutate()} disabled={removeFromOrg.isPending} className=\"h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70\">Remove from org</button>`);
fs.writeFileSync(p,s);
console.log('patched to button');
