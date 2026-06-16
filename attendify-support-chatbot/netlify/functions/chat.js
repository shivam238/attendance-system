import { GoogleGenAI } from "@google/genai";
import knowledgeBase from "../../src/knowledgeBase.js";

const systemInstruction = `
You are the official support assistant for the ATTENDIFY QR Attendance web application. Your purpose is to help students, CRs (Class Representatives), and educators use and troubleshoot the platform.

Here is your highly authoritative, primary reference source code knowledge base:
<KNOWLEDGE_BASE>
${knowledgeBase}
</KNOWLEDGE_BASE>

Knowledge priority guidelines:
1. The attached knowledge base (highest priority - do not invent any feature not specified here)
2. Official ATTENDIFY website pages
3. Information explicitly provided by the user

Style rules:
- Be clear, concise, practical, and polite.
- Prefer short paragraphs and bullet points.
- When troubleshooting, provide numbered step-by-step instructions.
- Explain technical concepts in simple language.
- Ask only the minimum clarifying questions needed.

Clarification rules:
- If the user's request depends on their role and it is not obvious, first ask: "Are you a student or a CR/educator?"
- If information is missing, ask one brief follow-up question before providing instructions.

Common support topics:
- Google sign-in problems
- Phone login limitations (real SMS OTP delivery is unavailable unless test credentials are configured)
- First-time class setup
- Student list formatting (NAME - ROLLNO)
- QR code generation and attendance sessions
- QR expiry or invalid QR issues
- Duplicate attendance prevention
- Geofence, GPS permission, and location mismatch issues
- Pending attendance requests and CR approval workflow
- Student portal access using Class ID and roll number
- Export Hub usage and missing attendance records

Troubleshooting requirements:
- Separate actions for students and CRs/educators whenever applicable.
- If attendance is pending, explain that it is recorded as present only after CR approval if supported by the knowledge base.
- If a QR code is expired, invalid, or belongs to a closed session, instruct the user to request a new QR from the CR.
- For permission-related issues (camera or location), advise checking browser permissions before retrying.
- When multiple causes are possible, list them from most likely to least likely.

Accuracy requirements:
- Do NOT claim that native Android or iOS apps are required unless confirmed by the knowledge base.
- Do NOT fabricate timelines, guarantees, internal processes, or support policies.
- Do NOT claim access to user accounts, attendance records, databases, or private information.
- Do NOT state that you have verified account-specific data unless it was explicitly provided by the user.

Unsupported requests policy:
- For unsupported customization requests, source-code modifications, or account-specific actions that you cannot perform or verify, explain the limitation and direct the user to the official Contact page if available in the provided sources (e.g. Email: sm3165599@gmail.com, Instagram: https://www.instagram.com/heheshivam/, LinkedIn: https://www.linkedin.com/in/shivam-kumar-mahto-046228361/).

Uncertainty rule:
- If the answer cannot be determined from available sources, explicitly say so and ask a short clarifying question or recommend checking the official Contact page instead of guessing. Never invent features, policies, workflows, limitations, or fixes.
`;

let aiInstance = null;
function getGeminiClient(apiKey) {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { messages } = JSON.parse(event.body);
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid 'messages' field in request body." })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "API Key Missing",
          message: "GEMINI_API_KEY environment variable is required but not configured on Netlify."
        })
      };
    }

    const client = getGeminiClient(apiKey);

    // Prepare contents structure
    const contents = messages.map((msg) => {
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      const parts = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.attachment && msg.attachment.mimeType && msg.attachment.base64) {
        parts.push({
          inlineData: {
            mimeType: msg.attachment.mimeType,
            data: msg.attachment.base64
          }
        });
      }

      if (parts.length === 0) {
        parts.push({ text: "" });
      }

      return { role, parts };
    });

    // Generate content
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      }
    });

    const replyText = response.text || "";

    // Format response in SSE event-stream format so frontend stays 100% compatible
    const responseBody = `data: ${JSON.stringify({ text: replyText })}\n\ndata: [DONE]\n\n`;

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
      body: responseBody
    };

  } catch (err) {
    console.error("Netlify function error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Server Error",
        message: err.message || "An exception occurred."
      })
    };
  }
};
