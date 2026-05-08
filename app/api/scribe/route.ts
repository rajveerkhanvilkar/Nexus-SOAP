import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // VERBATIM CLINICAL EXTRACTION PROMPT
    const prompt = `
      ROLE: Precision Medical Scribe.
      TASK: Extract professional English SOAP notes.
      
      STRICT RULES:
      1. VERBATIM MEDICINES: If a specific medicine brand (e.g., Dolo 650, Taxim-O, Pan-D) is mentioned, you MUST use that EXACT name in the 'Plan' section. Do NOT substitute it with generic names (like Paracetamol).
      2. ROLE ACCURACY: Carefully distinguish between Doctor and Patient. If someone asks "Doctor, what is the treatment?", that is the Patient.
      3. ENGLISH OUTPUT: Ensure the clinical notes are 100% English.
      4. NO REPETITION: Do not repeat info across sections.

      STRUCTURE:
      {
        "patient_name": "UPPERCASE_NAME",
        "soap": {
          "subjective": [{"text": "...", "confidence": 100}],
          "objective": [{"text": "...", "confidence": 100}],
          "assessment": [{"text": "...", "confidence": 100}],
          "plan": [{"text": "...", "confidence": 100}]
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
        finalResult.intelligence.mode = "Gemini Verbatim v5.6";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Verbatim Heuristics.");
    }

    // STEEL-CORE VERBATIM FALLBACK
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 95 });
      }
    };

    if (finalResult.soap.plan.length === 0) {
      // Priority: Extract Exact Medicine from Transcript
      const allMeds = Object.values(CLINICAL_DICTIONARY.MEDICINES).flat();
      allMeds.forEach(med => {
        if (lowerTranscript.includes(med.toLowerCase())) {
          add("plan", `Prescribed ${med} as per clinical conversation.`);
        }
      });

      if (lowerTranscript.includes("rest")) add("plan", "Complete physical rest recommended.");
      if (lowerTranscript.includes("water") || lowerTranscript.includes("hydration")) add("plan", "Increased oral fluid intake (Hydration) advised.");
    }

    if (finalResult.soap.subjective.length === 0) {
      if (lowerTranscript.includes("taap") || lowerTranscript.includes("fever")) add("subjective", "Patient reports febrile symptoms (Fever).");
      if (lowerTranscript.includes("khansi") || lowerTranscript.includes("cough")) add("subjective", "Respiratory distress with cough reported.");
    }

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Verbatim Resilience Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
