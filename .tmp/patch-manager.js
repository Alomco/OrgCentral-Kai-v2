const fs=require('fs');
const p='src/app/(app)/hr/compliance/_components/compliance-templates-manager.tsx';
let s=fs.readFileSync(p,'utf8');
if(!s.includes("useSearchParams")){
  s=s.replace(/from 'react';/, "from 'react';\nimport { useSearchParams } from 'next/navigation';");
}
if(!s.includes('ComplianceTemplatesFilters')){
  s=s.replace("from '../compliance-templates-query';", "from '../compliance-templates-query';\nimport { ComplianceTemplatesFilters } from './compliance-templates-filters.client';");
}
if(!s.includes('filteredTemplates')){
  const inject="\n\n    const searchParams = useSearchParams();\n    const q = (searchParams.get('q') ?? '').trim().toLowerCase();\n    const filteredTemplates = useMemo(() => {\n        if (!q) return templates;\n        return templates.filter((t) => {\n            const hay = `${t.name} ${t.categoryKey} ${t.version}`.toLowerCase();\n            return hay.includes(q);\n        });\n    }, [q, templates]);\n";
  s=s.replace(/(\}, \[templates\]\);)/, `$1${inject}`);
}
if(s.includes('<CardHeader') && !s.includes('ComplianceTemplatesFilters')){
  s=s.replace(/(<CardHeader[\s\S]*?>)([\s\S]*?<\/CardHeader>)/, (m,a,b)=> `${a}${b.replace('</CardHeader>', '<div className="flex justify-end"><ComplianceTemplatesFilters /></div></CardHeader>')}`);
}
s=s.replace(/templates\.length === 0/g,'filteredTemplates.length === 0');
s=s.replace(/templates\.map\(\(template\) =>/g,'filteredTemplates.map((template) =>');
fs.writeFileSync(p,s);
console.log('patched manager');
