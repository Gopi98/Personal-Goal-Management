import * as fs from 'fs';
let content = fs.readFileSync('src/lib/HubContext.tsx', 'utf-8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('src/lib/HubContext.tsx', content);
