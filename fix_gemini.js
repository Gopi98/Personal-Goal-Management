import fs from 'fs';
const content = fs.readFileSync('src/lib/gemini.ts', 'utf8');
fs.writeFileSync('src/lib/gemini.ts', content.replace(/gemini-1.5-flash/g, 'gemini-3-flash-preview'));
