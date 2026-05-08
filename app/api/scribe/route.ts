import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // HYPER-STRICT CLINICAL INTELLIGENCE PROMPT
    const prompt = `
      ROLE: World-Class Clinical Scribe & Medical Analyst.
      TASK: Extract accurate, professional, and non-repetitive SOAP notes from the provided transcript.
      
      RULES:
      1. S - SUBJECTIVE: Include ONLY patient's reported symptoms, history, and complaints. Normalize Hinglish to English.
      2. O - OBJECTIVE: Include ONLY clinical findings (Vitals, physical exam, reports, doctor's observations).
      3. A - ASSESSMENT: Provide professional clinical diagnosis or summary. Link findings to the diagnosis.
      4. P - PLAN: Provide treatment, medications, and follow-up instructions.
      5. NO REPETITION: Do not repeat info across sections. Keep each point distinct.
      6. ABSOLUTE ACCURACY: Do not hallucinate. If a medication or disease isn't in the transcript, don't write it.
      7. REFERENCE DICTIONARY: Use categories like ${Object.keys(CLINICAL_DICTIONARY.MEDICINES).join(', ')} for normalization.

      TRANSCRIPT: 
      ${transcript}
      
      OUTPUT FORMAT (JSON):
      {
        "patient_name": "UPPERCASE_NAME",
        "soap": {
          "subjective": [{"text": "...", "confidence": 100}],
          "objective": [{"text": "...", "confidence": 100}],
          "assessment": [{"text": "...", "confidence": 100}],
          "plan": [{"text": "...", "confidence": 100}]
        }
      }
    `;

    let finalResult: any = { 
      patient_name: null,
      soap: { subjective: [], objective: [], assessment: [], plan: [] },
      intelligence: { mode: "Military Heuristic" }
    };

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 9000))
      ]) as any;

      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        finalResult.soap = parsed.soap;
        finalResult.patient_name = parsed.patient_name;
        finalResult.intelligence.mode = "Gemini Clinical v5.0";
      }
    } catch (e) {
      console.warn("AI Engine slow, activating Clinical Heuristics.");
    }

    // STEEL-CORE RECOVERY MODE (USING EXPANDED DICTIONARY)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 90 });
      }
    };

    // Auto-Extraction Logic (Fallback)
    if (finalResult.soap.subjective.length === 0) {
      if (lowerTranscript.includes("name is") || lowerTranscript.includes("naam")) {
        const nameMatch = transcript.match(/(?:name is|naam|naav)\s+([a-zA-Z]+)/i);
        if (nameMatch) finalResult.patient_name = nameMatch[1].toUpperCase();
      }
      
      // Map Dictionary to Sections
      CLINICAL_DICTIONARY.SYMPTOMS.forEach(s => {
        if (lowerTranscript.includes(s.toLowerCase())) add("subjective", `Patient reports ${s.toLowerCase()}.`);
      });
    }

    if (finalResult.soap.plan.length === 0) {
      Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
        if (lowerTranscript.includes(m.toLowerCase())) add("plan", `Initiated ${m} therapy as discussed.`);
      });
    }

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "System: Local Resilience Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
