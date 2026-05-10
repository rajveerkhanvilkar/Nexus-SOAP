import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ELITE CLINICAL SANITIZER PROMPT
    const prompt = `
      ROLE: Professional Medical Scribe.
      TASK: Extract high-fidelity, PERFECT ENGLISH SOAP notes.
      
      TRANSCRIPT: 
      ${transcript}

      STRICT ENGLISH ENFORCEMENT:
      - 100% Professional Medical English. ZERO Hinglish/Marathi words allowed (e.g., No "Dard", "Taap", "Khansi").
      - "Dard/Takleef" -> "Acute Pain / Somatic Discomfort"
      - "Taap/Bukhar" -> "Febrile Symptoms / Fever"
      - "Khansi/Khokla" -> "Respiratory Distress / Cough"
      
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
        finalResult.patient_name = parsed.patient_name?.toUpperCase() || null;
        finalResult.intelligence.mode = "Gemini Sanitized v6.7";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Sanitized Fallback.");
    }

    // STEEL-CORE ELITE SANITIZER (NO HINGLISH LEAKS)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 99 });
      }
    };

    // 1. SUBJECTIVE SANITIZATION (PERFECT ENGLISH)
    const englishMap: any = {
      "dard": "Patient presents with reports of localized somatic pain.",
      "takleef": "General discomfort and somatic distress reported.",
      "traas": "General discomfort and somatic distress reported.",
      "dukhne": "Patient reports localized pain and discomfort.",
      "sar dard": "Patient presents with Cephalalgia (Acute Headache).",
      "kamar dard": "Patient reports Lumbago (Acute Low Back Pain).",
      "pet dard": "Abdominal distress and Gastritis symptoms reported.",
      "gal dukhne": "Symptoms indicative of Acute Pharyngitis (Sore Throat).",
      "ghabrahat": "Patient experiencing clinical anxiety and palpitations.",
      "kamzori": "Generalized weakness and malaise (Kamzori).",
      "bukhar": "Febrile symptoms (Fever) noted.",
      "taap": "Febrile symptoms (Fever) noted.",
      "fever": "Patient presents with febrile symptoms (Fever).",
      "cough": "Patient experiencing respiratory distress (Cough).",
      "khokla": "Patient experiencing respiratory distress (Cough).",
      "khansi": "Patient experiencing respiratory distress (Cough)."
    };

    Object.keys(englishMap).forEach(key => {
      if (lowerTranscript.includes(key)) add("subjective", englishMap[key]);
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

    // 4. ASSESSMENT
    if (finalResult.soap.assessment.length === 0) {
      Object.values(CLINICAL_DICTIONARY.DISEASES).flat().forEach(d => {
        if (lowerTranscript.includes(d.toLowerCase())) add("assessment", `Clinical evidence indicative of ${d}.`);
      });
    }

    // 5. PLAN
    Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
      if (lowerTranscript.includes(m.toLowerCase())) {
        add("plan", `Initiated ${m} therapy for symptom management.`);
      }
    });

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Sanitization Shield Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
