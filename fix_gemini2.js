import fs from 'fs';
const content = fs.readFileSync('src/lib/gemini.ts', 'utf8');
fs.writeFileSync('src/lib/gemini.ts', content.replace(/gemini-3-flash-preview/g, 'gemini-2.0-flash'));
const appContent = fs.readFileSync('src/App.tsx', 'utf8');
fs.writeFileSync('src/App.tsx', appContent.replace(/gemini-3.1-flash-tts-preview/g, 'gemini-2.0-flash'));
