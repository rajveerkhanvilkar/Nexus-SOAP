import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // PURE-ENGLISH CLINICAL INTELLIGENCE PROMPT
    const prompt = `
      ROLE: Elite Medical Scribe (English-Only Output).
      TASK: Extract professional English SOAP notes.
      
      CRITICAL RULE: 
      - The input transcript may contain Hinglish or Marathi.
      - The OUTPUT must be 100% PROFESSIONAL CLINICAL ENGLISH ONLY.
      - Translate terms like "Bukhar" to "Fever", "Dard" to "Pain", "Khokla" to "Cough".
      - Do not use any non-English words in the 'soap' object.

      STRUCTURE:
      {
        "patient_name": "UPPERCASE_NAME",
        "soap": {
          "subjective": [{"text": "PRO_ENGLISH_NOTE", "confidence": 100}],
          "objective": [{"text": "PRO_ENGLISH_NOTE", "confidence": 100}],
          "assessment": [{"text": "PRO_ENGLISH_NOTE", "confidence": 100}],
          "plan": [{"text": "PRO_ENGLISH_NOTE", "confidence": 100}]
        }
      }

      TRANSCRIPT: 
      ${transcript}
    `;

    let finalResult: any = { 
      patient_name: null,
      soap: { subjective: [], objective: [], assessment: [], plan: [] },
      intelligence: { mode: "Military Heuristic" }
    };

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]) as any;

      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        finalResult.soap = parsed.soap;
        finalResult.patient_name = parsed.patient_name;
        finalResult.intelligence.mode = "Gemini Pure-English v5.1";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Steel-Core Fallback.");
    }

    // STEEL-CORE RECOVERY (MAPPING REGIONAL TO ENGLISH)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 90 });
      }
    };

    if (finalResult.soap.subjective.length === 0) {
      // Translate Regional Symptoms to English Sentences
      if (lowerTranscript.includes("taap") || lowerTranscript.includes("bukhar")) add("subjective", "Patient reports febrile symptoms (fever).");
      if (lowerTranscript.includes("khansi") || lowerTranscript.includes("khokla")) add("subjective", "Persistent cough reported by patient.");
      if (lowerTranscript.includes("dard") || lowerTranscript.includes("dukhne")) add("subjective", "Localized pain and discomfort reported.");
      if (lowerTranscript.includes("chakkar")) add("subjective", "Patient experiencing episodes of dizziness.");
    }

    if (finalResult.soap.plan.length === 0) {
      if (lowerTranscript.includes("dolo") || lowerTranscript.includes("calpol")) add("plan", "Paracetamol therapy initiated for fever management.");
      if (lowerTranscript.includes("pani") || lowerTranscript.includes("hydration")) add("plan", "Strict hydration protocol recommended.");
    }

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Pure-English Recovery Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
