const Anthropic = require("@anthropic-ai/sdk");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

async function testClaude() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.slice(0, 10) + "..." : "MISSING");

  if (!apiKey || apiKey.includes("your_anthropic_api_key")) {
    console.error("API Key is not configured correctly.");
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    console.log("Sending request to Claude...");
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: "Hello, are you working?" }],
    });
    console.log("Response:", message.content[0].text);
  } catch (err) {
    console.error("Error calling Anthropic:", err.message);
    if (err.status) console.error("Status:", err.status);
    if (err.type) console.error("Type:", err.type);
  }
}

testClaude();
