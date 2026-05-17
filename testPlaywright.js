import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console events
  page.on('console', msg => {
    if (msg.text().includes('App.tsx received response')) {
       console.log('BROWSER CONSOLE:', msg.text());
    }
    if (msg.text().includes('No response')) {
       console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  // Navigate to the app
  await page.goto('http://localhost:3000');
  
  // Wait for the chatbot button to appear and click it
  // Look for the "Talk to Trojan AI" tooltip button by finding the Bot icon or button class
  await page.waitForSelector('button.w-14.h-14');
  await page.click('button.w-14.h-14');
  
  // Wait for the input field to be visible in the chat window
  await page.waitForSelector('input[placeholder="Command Trojan..."]');
  
  // Type the command
  await page.fill('input[placeholder="Command Trojan..."]', 'goal yearly Apply for Aus jobs create 15 subtask saying week 1 apply 10 jobs, week 2 apply 10 jobs .... like that');
  
  // Hit enter
  await page.keyboard.press('Enter');
  
  // Wait for the new message to appear or wait a few seconds
  await page.waitForTimeout(10000); // give it time to call Gemini API
  
  // Extract all text from message bubbles
  const messages = await page.$$eval('.bg-\\[\\#1A1A24\\]', els => els.map(e => e.innerText));
  
  console.log("Chatbot responses:");
  console.log(messages.join('\n\n'));
  
  await browser.close();
})();
