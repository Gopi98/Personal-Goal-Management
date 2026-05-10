import fs from 'fs';
const content = fs.readFileSync('src/lib/gemini.ts', 'utf8');
fs.writeFileSync('src/lib/gemini.ts', content.replace(/"gemini-[^"]+"/g, '"gemini-3.1-pro-preview"'));
const appContent = fs.readFileSync('src/App.tsx', 'utf8');
fs.writeFileSync('src/App.tsx', appContent.replace(/"gemini-[^"]+"/g, '"gemini-3.1-pro-preview"'));
