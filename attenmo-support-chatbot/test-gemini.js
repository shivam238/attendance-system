import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import knowledgeBase from "./src/knowledgeBase.js";

const systemInstruction = `
You are the official support assistant for the AttenMo QR Attendance web application. Your purpose is to help students, CRs (Class Representatives), and educators use and troubleshoot the platform.

Here is your highly authoritative, primary reference source code knowledge base:
<KNOWLEDGE_BASE>
${knowledgeBase}
</KNOWLEDGE_BASE>
`;

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = [{ role: "user", parts: [{ text: "Hello, how do I setup a class?" }] }];
    
    console.log("Calling generateContentStream...");
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    for await (const chunk of responseStream) {
      console.log("Chunk:", chunk.text);
    }
    console.log("Stream finished successfully!");
  } catch (err) {
    console.error("Error occurred:", err);
  }
}

run();
