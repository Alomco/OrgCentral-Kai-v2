const fs=require('fs');
const p='src/app/(app)/org/members/_components/member-actions.tsx';
let s=fs.readFileSync(p,'utf8');
const pattern=/<div className=\"flex flex-wrap gap-2\">[\s\S]*?<\/div>\s*\n\s*<\/div>/;
const m=s.match(pattern);
if(m){ let block=m[0]; if(!block.includes('Remove from org')){ block=block.replace(/<\/div>\s*\n\s*<\/div>$/, `  \n                <form action={() => removeFromOrg.mutate()}>\n                    <button type=\"submit\" disabled={removeFromOrg.isPending} className=\"h-9 w-fit rounded-md border border-[oklch(var(--border))] bg-[oklch(var(--background))] px-3 text-sm font-medium text-[oklch(var(--foreground))] disabled:opacity-70\">Remove from org</button>\n                </form>\n            </div>\n        </div>`); s=s.replace(pattern, block); fs.writeFileSync(p,s); console.log('inserted'); } else { console.log('already'); } } else { console.log('pattern not found'); }
