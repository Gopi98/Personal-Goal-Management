import { getTrojanChatResponse } from './src/lib/gemini';
async function test() {
  const result = await getTrojanChatResponse("create yearly task 1 learn python", [], [], []);
  console.log(result);
}
test();
