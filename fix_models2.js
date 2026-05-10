import fs from 'fs';
const content = fs.readFileSync('src/lib/gemini.ts', 'utf8');
fs.writeFileSync('src/lib/gemini.ts', content.replace(/gemini-2\.5-flash/g, 'gemini-3-flash-preview'));
const content2 = fs.readFileSync('src/App.tsx', 'utf8');
fs.writeFileSync('src/App.tsx', content2.replace(/gemini-2\.5-flash/g, 'gemini-3.1-flash-tts-preview'));
