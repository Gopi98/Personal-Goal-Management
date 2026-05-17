async function test() {
  const req = await fetch("http://localhost:3000/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }]
    })
  });
  const res = await req.json();
  console.log(res);
}
test();
