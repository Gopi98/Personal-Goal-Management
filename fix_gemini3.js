import fs from 'fs';
const content = fs.readFileSync('src/lib/gemini.ts', 'utf8');
fs.writeFileSync('src/lib/gemini.ts', content.replace(/gemini-2.0-flash/g, 'gemini-2.5-flash'));
const appContent = fs.readFileSync('src/App.tsx', 'utf8');
fs.writeFileSync('src/App.tsx', appContent.replace(/gemini-2.0-flash/g, 'gemini-2.5-flash'));
