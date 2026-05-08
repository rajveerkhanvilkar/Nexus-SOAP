import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // HYPER-VIGILANT CLINICAL EXTRACTION PROMPT
    const prompt = `
      ROLE: World-Class Medical Scribe.
      TASK: Extract accurate, professional, and English-only SOAP notes.
      
      TRANSCRIPT: 
      ${transcript}

      STRICT EXTRACTION RULES:
      1. OBJECTIVE: You MUST extract all vitals (Temperature, BP, Pulse, Oxygen/SpO2). Look for numbers like "102 degree", "BP is 120", "oxygen is low".
      2. ASSESSMENT: You MUST extract the diagnosis. Look for "looks like", "seems to be", "diagnosis is", "assessment is". If a disease like "Viral Fever" is mentioned, it belongs here.
      3. SUBJECTIVE: Symptoms reported by patient (Fever, Cough, etc.).
      4. PLAN: Verbatim medicines (e.g., Dolo 650), rest, and hydration. Use exact brand names.
      5. PHONETIC CORRECTION: Correct "do or 650" to "Dolo 650", "dis" to "this", etc.
      
      STRUCTURE (JSON ONLY):
      {
        "patient_name": "NAME",
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
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]) as any;

      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        finalResult.soap = parsed.soap;
        finalResult.patient_name = parsed.patient_name;
        finalResult.intelligence.mode = "Gemini Vigilance v5.9";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Vigilance Fallback.");
    }

    // STEEL-CORE VIGILANCE FALLBACK (REGEX & SEMANTIC)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 98 });
      }
    };

    // 1. OBJECTIVE SCAN (VITALS)
    const tempMatch = transcript.match(/(\d+)\s*(?:degree|temp|temperature)/i);
    if (tempMatch) add("objective", `Body Temperature recorded at ${tempMatch[1]}°F.`);
    
    const bpMatch = transcript.match(/bp\s*(?:is|of)?\s*(\d+)/i);
    if (bpMatch) add("objective", `Blood Pressure (Systolic) measured at ${bpMatch[1]} mmHg.`);

    const oxMatch = lowerTranscript.includes("oxygen") && (lowerTranscript.includes("low") || transcript.match(/(\d+)\s*%/));
    if (oxMatch) add("objective", "Oxygen saturation levels (SpO2) noted as low/reduced.");

    // 2. ASSESSMENT SCAN (DIAGNOSIS)
    Object.values(CLINICAL_DICTIONARY.DISEASES).flat().forEach(d => {
      if (lowerTranscript.includes(d.toLowerCase())) {
        add("assessment", `Clinical evidence supports diagnosis of ${d}.`);
      }
    });

    // 3. SUBJECTIVE SCAN
    CLINICAL_DICTIONARY.SYMPTOMS.forEach(s => {
      if (lowerTranscript.includes(s.toLowerCase())) add("subjective", `Patient reports symptoms of ${s.toLowerCase()}.`);
    });

    // 4. PLAN SCAN
    Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
      if (lowerTranscript.includes(m.toLowerCase()) || lowerTranscript.includes("do or 650")) {
        const medName = lowerTranscript.includes("do or 650") ? "Dolo 650" : m;
        add("plan", `Initiated treatment with ${medName} as prescribed.`);
      }
    });

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Vigilance Mode: Security Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
