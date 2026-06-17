import knowledgeBase from "../../attendify-support-chatbot/src/knowledgeBase.js";

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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const MAX_MESSAGES = 12;
const MAX_TEXT_CHARS = 2000;
const MAX_ATTACHMENT_BASE64_CHARS = 1500000;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function validateMessages(messages) {
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    return `Please send between 1 and ${MAX_MESSAGES} messages.`;
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return "Each message must be an object.";
    }
    if (msg.content !== undefined && typeof msg.content !== "string") {
      return "Message content must be text.";
    }
    if ((msg.content || "").length > MAX_TEXT_CHARS) {
      return `Each message must be ${MAX_TEXT_CHARS} characters or fewer.`;
    }
    if (msg.attachment) {
      const { mimeType, base64 } = msg.attachment;
      if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType) || typeof base64 !== "string") {
        return "Attachments must be PNG, JPEG, or WebP images.";
      }
      if (base64.length > MAX_ATTACHMENT_BASE64_CHARS) {
        return "Attachment is too large.";
      }
    }
  }
  return null;
}

function isRateLimitOrQuotaError(err) {
  const msg = (err?.message || "").toLowerCase();
  const status = err?.status ?? err?.statusCode;
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("ratequotaexceeded")
  );
}

async function callOpenRouter(openRouterKey, messages) {
  const openAiMessages = [
    { role: "system", content: systemInstruction },
    ...messages.map((msg) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "assistant" : "user",
      content: msg.content || "(image attached — description unavailable in fallback mode)"
    }))
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://qr-smart-attendance.web.app",
      "X-Title": "ATTENDIFY Support"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: openAiMessages,
      temperature: 0.2,
      max_tokens: 1024
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `OpenRouter responded with ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    try {
      let parsed;
      try {
        parsed = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      const { messages } = parsed;
      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Missing or invalid 'messages' field in request body." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      const validationError = validateMessages(messages);
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      const geminiKey = env.GEMINI_API_KEY;
      const openRouterKey = env.OPENROUTER_API_KEY;

      if (!geminiKey) {
        return new Response(JSON.stringify({ error: "API Key Missing", message: "GEMINI_API_KEY env var is not configured." }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
        });
      }

      let replyText = "";
      let usedFallback = false;

      try {
        const contents = messages.map((msg) => {
          const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
          const parts = [];

          if (msg.content) parts.push({ text: msg.content });

          if (msg.attachment?.mimeType && msg.attachment?.base64) {
            parts.push({
              inlineData: {
                mimeType: msg.attachment.mimeType,
                data: msg.attachment.base64
              }
            });
          }

          if (parts.length === 0) parts.push({ text: "" });
          return { role, parts };
        });

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.2
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gemini API responded with ${res.status}`);
        }

        const data = await res.json();
        replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      } catch (geminiErr) {
        const isQuota = isRateLimitOrQuotaError(geminiErr);
        console.warn(
          isQuota
            ? "Gemini quota/rate-limit hit — switching to OpenRouter fallback."
            : "Gemini error — switching to OpenRouter fallback.",
          geminiErr?.message || geminiErr
        );

        if (!openRouterKey) {
          throw geminiErr;
        }

        replyText = await callOpenRouter(openRouterKey, messages);
        usedFallback = true;
      }

      const responseBody = `data: ${JSON.stringify({ text: replyText })}\n\ndata: [DONE]\n\n`;

      return new Response(responseBody, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });

    } catch (err) {
      console.error("Cloudflare Worker error:", err);
      return new Response(JSON.stringify({
        error: "Server Error",
        message: "An internal error occurred. Please try again later."
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
  }
};
