const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const fs = require('fs');

// Manually read .env.local
const envPath = path.resolve(__dirname, "../../../.env.local");
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function listModels() {
  console.log("Using API Key:", apiKey ? apiKey.slice(0, 15) + "..." : "MISSING");

  if (!apiKey || apiKey.includes("your_anthropic_api_key")) {
    console.error("API Key is not configured correctly.");
    return;
  }

  try {
    console.log("Fetching models list via Fetch API...");
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log("Available models:", JSON.stringify(data, null, 2));
    } else {
        const err = await response.text();
        console.error("Failed to list models:", response.status, err);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
