import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // BHARAT-TECHNICAL SEMANTIC PROMPT
    const prompt = `
      ROLE: Elite Medical Scribe & Semantic Translator.
      TASK: Extract unique English SOAP notes from Hinglish/Indian transcript.
      
      TRANSCRIPT: 
      ${transcript}

      CLINICAL UP-SCALING RULES:
      1. S - SUBJECTIVE: Translate Hinglish symptoms to formal English.
         - "Sar Dard" -> "Cephalalgia / Acute Headache"
         - "Kamar Dard" -> "Lumbago / Acute Low Back Pain"
         - "Pet Dard" -> "Abdominal Pain / Gastritis"
         - "Gal Dukhne" -> "Acute Pharyngitis / Sore Throat"
         - "Ghabrahat" -> "Clinical Anxiety / Palpitations"
      2. O - OBJECTIVE: Vitals and symbols (102°, BP 120).
      3. A - ASSESSMENT: Narrative clinical summary (No templates).
      4. P - PLAN: Verbatim meds (Dolo 650, Saridon, Moov).
      
      STRUCTURE:
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
        finalResult.patient_name = parsed.patient_name?.toUpperCase() || null;
        finalResult.intelligence.mode = "Gemini Semantic v6.6";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Semantic Fallback.");
    }

    // STEEL-CORE SEMANTIC FALLBACK (HINGLISH TO FORMAL ENGLISH)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 99 });
      }
    };

    // 1. SUBJECTIVE UP-SCALING
    const semanticMap: any = {
      "sar dard": "Patient presents with Cephalalgia (Acute Headache).",
      "kamar dard": "Patient reports Lumbago (Acute Low Back Pain).",
      "pet dard": "Abdominal distress and Gastritis symptoms reported.",
      "gal dukhne": "Symptoms indicative of Acute Pharyngitis (Sore Throat).",
      "ghabrahat": "Patient experiencing clinical anxiety and palpitations.",
      "kamzori": "Generalized weakness and malaise (Kamzori).",
      "bukhar": "Febrile symptoms (Fever) noted.",
      "taap": "Febrile symptoms (Fever) noted."
    };

    Object.keys(semanticMap).forEach(key => {
      if (lowerTranscript.includes(key)) add("subjective", semanticMap[key]);
    });

    // 2. IDENTITY
    if (!finalResult.patient_name) {
      const nameMatch = transcript.match(/(?:my name is|mera naam|maaza naav|i am|this is|name)\s+([a-zA-Z]+)/i);
      if (nameMatch) finalResult.patient_name = nameMatch[1].toUpperCase();
    }

    // 3. VITALS (OBJECTIVE)
    const tempMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:°|degree|degrees|deg|f)/i) || 
                      transcript.match(/(?:fever of|fever is|fever)\s*(\d+(?:\.\d+)?)/i);
    if (tempMatch) add("objective", `Clinical Thermometry: ${tempMatch[1]}°F.`);
    
    const bpMatch = transcript.match(/(?:bp|blood pressure)\s*(?:is|of)?\s*(\d+)/i) || transcript.match(/(\d+)\s*(?:bp)/i);
    if (bpMatch) add("objective", `Hemodynamic Status: BP ${bpMatch[1]} mmHg.`);

    // 4. PLAN (VERBATIM MEDS)
    Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
      if (lowerTranscript.includes(m.toLowerCase())) {
        add("plan", `Initiated ${m} therapy for symptom management.`);
      }
    });
    if (lowerTranscript.includes("rest")) add("plan", "Strict physical rest protocol initiated.");
    if (lowerTranscript.includes("water") || lowerTranscript.includes("hydration")) add("plan", "Aggressive oral hydration advised.");

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Semantic Resilience Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
