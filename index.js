const { SarvamAIClient } = require("sarvamai");

if (process.loadEnvFile) {
  process.loadEnvFile();
}

async function main() {
  const client = new SarvamAIClient();

  const response = await client.chat.completions({
    model: "sarvam-105b-conversations",
    messages: [
      {
        role: "user",
        content: "Hello! Introduce yourself briefly in one sentence.",
      },
    ],
  });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
