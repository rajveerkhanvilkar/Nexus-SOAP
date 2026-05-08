import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // UNIVERSAL SYMBOL & FEVER PROMPT
    const prompt = `
      ROLE: Precision Medical Scribe.
      TASK: Extract high-fidelity English SOAP notes.
      
      TRANSCRIPT: 
      ${transcript}

      STRICT VITALS RULE:
      - Extract Temperature regardless of symbols or words (e.g., "102°", "102 degree", "fever of 101").
      - Extract BP and Oxygen.
      
      STRUCTURE (JSON):
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
        finalResult.intelligence.mode = "Gemini Symbol-V v6.5";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Symbol-V Fallback.");
    }

    // STEEL-CORE SYMBOL & FEVER SCANNER
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 99 });
      }
    };

    // 1. IDENTITY
    if (!finalResult.patient_name) {
      const nameMatch = transcript.match(/(?:my name is|mera naam|maaza naav|i am|this is|name)\s+([a-zA-Z]+)/i);
      if (nameMatch) finalResult.patient_name = nameMatch[1].toUpperCase();
    }

    // 2. REFINED TEMP SCANNER (Symbols, Degree, Fever patterns)
    // Matches: 102, 102.5, 102°, 102 degree, fever of 101
    const tempMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:°|degree|degrees|deg|fahrenheit|f)/i) || 
                      transcript.match(/(?:fever of|fever is|fever)\s*(\d+(?:\.\d+)?)/i);
    
    if (tempMatch) add("objective", `Clinical Thermometry: ${tempMatch[1]}°F.`);
    
    // 3. BP SCANNER
    const bpMatch = transcript.match(/(?:bp|blood pressure)\s*(?:is|of)?\s*(\d+)/i) || transcript.match(/(\d+)\s*(?:bp)/i);
    if (bpMatch) add("objective", `Hemodynamic Status: BP ${bpMatch[1]} mmHg.`);

    // 4. SUBJECTIVE (SYMPTOMS)
    CLINICAL_DICTIONARY.SYMPTOMS.forEach(s => {
      if (lowerTranscript.includes(s.toLowerCase())) {
        const englishMap: any = { "taap": "Fever", "bukhar": "Fever", "khokla": "Cough", "khansi": "Cough", "ashaktapana": "Weakness", "kamzori": "Weakness" };
        const sym = englishMap[s.toLowerCase()] || s;
        add("subjective", `Patient reports symptoms of ${sym.toLowerCase()}.`);
      }
    });

    // 5. ASSESSMENT
    if (finalResult.soap.assessment.length === 0) {
      Object.values(CLINICAL_DICTIONARY.DISEASES).flat().forEach(d => {
        if (lowerTranscript.includes(d.toLowerCase())) add("assessment", `Clinical evidence indicative of ${d}.`);
      });
    }

    // 6. PLAN
    Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
      if (lowerTranscript.includes(m.toLowerCase()) || (m === "Dolo 650" && lowerTranscript.includes("do or 650"))) {
        add("plan", `Initiated ${m} therapy.`);
      }
    });
    if (lowerTranscript.includes("rest")) add("plan", "Strict physical rest advised.");
    if (lowerTranscript.includes("water") || lowerTranscript.includes("hydration")) add("plan", "Aggressive oral hydration protocol.");

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Symbol Resilience Protocol: Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
