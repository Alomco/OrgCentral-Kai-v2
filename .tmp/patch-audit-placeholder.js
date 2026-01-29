const fs=require(''fs'');
const p='src/app/(app)/org/audit/_components/audit-log-client.tsx';
let s=fs.readFileSync(p,'utf8');
s=s.replace(/â€”/g,'N/A');
fs.writeFileSync(p,s);
console.log('patched');
