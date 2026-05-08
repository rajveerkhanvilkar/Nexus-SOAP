import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. HYPER-STRICT AI PROMPT
    const prompt = `
      ROLE: Elite Medical Scribe.
      TASK: Extract Patient Name and professional English SOAP notes.
      TRANSCRIPT: ${transcript}
      
      STRUCTURE:
      {
        "patient_name": "NAME_HERE",
        "soap": { "subjective": [...], "objective": [...], "assessment": [...], "plan": [...] }
      }
    `;

    let finalResult: any = { 
      patient_name: null,
      soap: { subjective: [], objective: [], assessment: [], plan: [] },
      intelligence: { ai_mode: "Local Heuristic" }
    };

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
      ]) as any;

      const response = await result.response;
      const responseText = response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        finalResult.soap = parsed.soap || parsed;
        finalResult.patient_name = parsed.patient_name || null;
        finalResult.intelligence.ai_mode = "Gemini Semantic";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Steel-Core Fallback.");
    }

    // 2. STEEL-CORE FALLBACK (v4.8 - IDENTITY & CLINICAL)
    const lines = transcript.split('\n');
    
    // IDENTITY SCANNER (Regex)
    if (!finalResult.patient_name) {
      const nameRegex = /(?:my name is|mera naam|maaza naav|i am|mee)\s+([a-zA-Z]+)/i;
      for (const line of lines) {
        const match = line.match(nameRegex);
        if (match) {
          finalResult.patient_name = match[1].trim().toUpperCase();
          break;
        }
      }
    }

    // CLINICAL SCANNER (Semantic Fallback)
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => finalResult.soap[section].push({ text, confidence: 85 });

    if (finalResult.soap.subjective.length === 0) {
      if (lowerTranscript.includes("khasi") || lowerTranscript.includes("cough")) add("subjective", "Patient reports persistent cough symptoms.");
      if (lowerTranscript.includes("bukhar") || lowerTranscript.includes("fever")) add("subjective", "Febrile symptoms reported by patient.");
      if (lowerTranscript.includes("dard") || lowerTranscript.includes("pain")) add("subjective", "Localized pain/discomfort reported.");
    }

    if (finalResult.soap.plan.length === 0) {
      if (lowerTranscript.includes("crocin")) add("plan", "Paracetamol (Crocin) advised for symptomatic relief.");
      if (lowerTranscript.includes("rest")) add("plan", "Adequate rest and reduced exertion recommended.");
      if (lowerTranscript.includes("pani") || lowerTranscript.includes("hydration")) add("plan", "Aggressive hydration maintenance advised.");
    }

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null,
      soap: { subjective: [{text: "Local Scribe: Recovery Mode Active.", confidence: 50}], objective: [], assessment: [], plan: [] } 
    });
  }
}
