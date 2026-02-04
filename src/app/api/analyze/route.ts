import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "No API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Remove header data if present (data:image/jpeg;base64,...)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = "Analyze this image for a whistleblowing report. Return a JSON object with two fields: 'authenticityScore' (a number between 0-100 based on how real the photo looks, looking for editing artifacts) and 'confidenceReason' (a very short summary of why).";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Cleanup the text to ensure it's JSON
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json(JSON.parse(cleanText));
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "AI Analysis Failed" }, { status: 500 });
  }
}