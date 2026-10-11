const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Load .env variables
if (process.loadEnvFile) {
  try {
    process.loadEnvFile();
  } catch (err) {
    console.warn("Could not auto-load .env file:", err.message);
  }
}

const { SarvamAIClient } = require("sarvamai");

let sarvamClient = null;
try {
  sarvamClient = new SarvamAIClient();
} catch (e) {
  console.error("Failed to initialize SarvamAIClient:", e.message);
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg"
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      hasKey: Boolean(process.env.SARVAM_API_KEY),
      model: "sarvam-105b-conversations",
      ttsModel: "bulbul:v3"
    });
    return;
  }

  if (pathname === "/api/chat" && req.method === "POST") {
    try {
      const { message, history = [], language = "en-IN", topic = "General" } = await readBody(req);
      if (!message) {
        return sendJson(res, 400, { error: "Message is required" });
      }

      const systemPrompt = `You are Priya, a lifelike, engaging, and empathetic AI Avatar Tutor powered by Sarvam AI.
You teach students across India in an intuitive, visual, and encouraging way.
Current subject/topic: ${topic}.
Preferred interaction language: ${language}.
When responding:
1. Explain the concept clearly and concisely (2-4 punchy paragraphs max, friendly tone).
2. If the concept involves a formula, geometric figure, biological cycle, or physics mechanism, include a clean WHITEBOARD directive at the end in this format:
<<<WHITEBOARD
{
  "type": "diagram",
  "title": "Short title of the visual diagram",
  "visualType": "triangle" | "photosynthesis" | "force" | "binary_search" | "circle" | "formula",
  "formula": "Primary formula if applicable, e.g. a² + b² = c²",
  "keyPoints": ["Step 1 / Key label", "Step 2 / Key label", "Step 3 / Key label"],
  "summary": "One sentence recap of the diagram"
}
>>>
3. Always finish with an adaptive follow-up quiz question with 3 options:
<<<QUIZ
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C"],
  "correctIndex": 0,
  "explanation": "Why this answer is correct"
}
>>>
Keep your explanation natural and easy to read aloud by text-to-speech.`;

      const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        })),
        { role: "user", content: message }
      ];

      const completion = await sarvamClient.chat.completions({
        model: "sarvam-105b-conversations",
        messages: formattedMessages
      });

      const replyRaw = completion.choices[0]?.message?.content || "I am processing your question.";

      // Parse Whiteboard directive if present
      let whiteboardData = null;
      let cleanedReply = replyRaw;
      const wbMatch = replyRaw.match(/<<<WHITEBOARD\s*([\s\S]*?)\s*>>>/);
      if (wbMatch) {
        try {
          whiteboardData = JSON.parse(wbMatch[1]);
          cleanedReply = cleanedReply.replace(wbMatch[0], "").trim();
        } catch (e) {
          console.warn("Failed to parse whiteboard JSON", e);
        }
      }

      // Parse Quiz directive if present
      let quizData = null;
      const quizMatch = cleanedReply.match(/<<<QUIZ\s*([\s\S]*?)\s*>>>/);
      if (quizMatch) {
        try {
          quizData = JSON.parse(quizMatch[1]);
          cleanedReply = cleanedReply.replace(quizMatch[0], "").trim();
        } catch (e) {
          console.warn("Failed to parse quiz JSON", e);
        }
      }

      return sendJson(res, 200, {
        reply: cleanedReply,
        whiteboard: whiteboardData,
        quiz: quizData,
        raw: replyRaw
      });
    } catch (err) {
      console.error("Chat API error:", err);
      return sendJson(res, 500, {
        error: err.message || "Failed to generate tutor response",
        fallback: "Let's explore this concept step-by-step together!"
      });
    }
  }

  if (pathname === "/api/tts" && req.method === "POST") {
    try {
      const { text, language_code = "en-IN", speaker = "priya" } = await readBody(req);
      if (!text) {
        return sendJson(res, 400, { error: "Text is required" });
      }

      // Limit length for low-latency avatar speech synthesis
      const sanitizedText = text
        .replace(/<<<[\s\S]*?>>>/g, "")
        .replace(/[*_#`]/g, "")
        .slice(0, 450)
        .trim();

      const response = await sarvamClient.textToSpeech.convert({
        text: sanitizedText,
        language_code: language_code,
        model: "bulbul:v3",
        speaker: speaker
      });

      const audioBase64 = response.audios && response.audios[0] ? response.audios[0] : null;
      return sendJson(res, 200, {
        audio: audioBase64,
        text: sanitizedText,
        speaker: speaker,
        language_code: language_code
      });
    } catch (err) {
      console.error("TTS API error:", err);
      return sendJson(res, 500, { error: err.message || "TTS conversion failed" });
    }
  }

  if (pathname === "/api/translate" && req.method === "POST") {
    try {
      const { input, source_language_code = "en-IN", target_language_code = "hi-IN" } = await readBody(req);
      if (!input) {
        return sendJson(res, 400, { error: "Input text is required" });
      }

      const response = await sarvamClient.text.translate({
        input: input,
        source_language_code: source_language_code,
        target_language_code: target_language_code
      });

      return sendJson(res, 200, {
        translated_text: response.translated_text
      });
    } catch (err) {
      console.error("Translate API error:", err);
      return sendJson(res, 500, { error: err.message || "Translation failed" });
    }
  }

  // Serve static files from public/
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Server Error");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Sarvam AI Avatar Tutor Demo Server running at http://localhost:${PORT}`);
});
