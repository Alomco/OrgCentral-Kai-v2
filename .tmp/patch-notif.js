const fs=require('fs');
const path='src/app/(app)/hr/notifications/_components/notification-filters.tsx';
let s=fs.readFileSync(path,'utf8');
if(!s.includes("Input")){
  s=s.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\nimport { Input } from '@/components/ui/input';");
}
if(!s.includes('const q =')){
  s=s.replace('const hasFilters', "const q = searchParams.get('q') ?? '';\n  const hasFilters");
}
if(!s.includes('Search notifications')){
  s=s.replace(/return \(\s*<div className=\"flex flex-wrap items-center gap-4 mb-6\">/, `return (\n    <div className=\"flex flex-wrap items-center gap-4 mb-6\">\n      <div className=\"w-64\">\n        <Input aria-label=\"Search notifications\" placeholder=\"Search\" defaultValue={q} onChange={(e)=>updateFilters('q', e.target.value.trim().length>0 ? e.target.value : null)} disabled={isPending} className=\"h-9\" />\n      </div>`);
}
fs.writeFileSync(path,s);
console.log('patched notif filters');
