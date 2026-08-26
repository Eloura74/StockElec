import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash-8b"]) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Bonjour, réponds 'OK'");
      console.log(`Result for ${modelName}:`, result.response.text());
    } catch (e) {
      console.error(`Error with ${modelName}:`, e.message);
    }
  }
}

testGemini();
