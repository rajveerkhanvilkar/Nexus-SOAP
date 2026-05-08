import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // HYPER-RESILIENT IDENTITY & NARRATIVE PROMPT
    const prompt = `
      ROLE: Precision Medical Scribe.
      TASK: Extract Patient Name and unique English SOAP notes.
      
      TRANSCRIPT: 
      ${transcript}

      IDENTITY RULE: 
      - Extract the Patient Name. Look for "My name is", "Mera naam", "Maaza naav", "I am", "This is". 
      - The name is usually at the start of the conversation.
      
      NARRATIVE RULE:
      - ASSESSMENT: Write a unique, dynamic clinical summary. Do not use templates.
      - SOAP sections must be professional English.
      - Verbatim medicines (e.g., Dolo 650).

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
        finalResult.intelligence.mode = "Gemini Identity v6.1";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Identity Fallback.");
    }

    // STEEL-CORE IDENTITY SCANNER (REINFORCED)
    if (!finalResult.patient_name) {
      const namePatterns = [
        /(?:my name is|mera naam|maaza naav|i am|this is|name|naav)\s+([a-zA-Z]+)/i,
        /([a-zA-Z]+)\s+(?:bol raha hoon|boltoy|here)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = transcript.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim().toUpperCase();
          if (!["DOCTOR", "PATIENT", "THE", "MY"].includes(name)) {
            finalResult.patient_name = name;
            break;
          }
        }
      }
    }

    // DYNAMIC FALLBACKS
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 95 });
      }
    };

    // Assessment Fallback (Varied)
    if (finalResult.soap.assessment.length === 0) {
      Object.values(CLINICAL_DICTIONARY.DISEASES).flat().forEach(d => {
        if (lowerTranscript.includes(d.toLowerCase())) {
          add("assessment", `Clinical presentation suggests a case of ${d}.`);
        }
      });
    }

    // Vitals (Objective)
    const tempMatch = transcript.match(/(\d+)\s*(?:degree|temp|temperature)/i);
    if (tempMatch) add("objective", `Observed temperature of ${tempMatch[1]}°F.`);
    
    const bpMatch = transcript.match(/bp\s*(?:is|of)?\s*(\d+)/i);
    if (bpMatch) add("objective", `Recorded BP of ${bpMatch[1]} mmHg.`);

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Identity Protection Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
