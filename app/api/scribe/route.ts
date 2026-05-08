import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();
    if (!transcript) return NextResponse.json({ error: "No transcript" }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // NARRATIVE-CLINICAL INTELLIGENCE PROMPT
    const prompt = `
      ROLE: Senior Medical Consultant & Scribe.
      TASK: Extract high-fidelity, unique, and professional English SOAP notes.
      
      TRANSCRIPT: 
      ${transcript}

      STRICT NARRATIVE RULES:
      1. ASSESSMENT: Do NOT use templates. Write a dynamic, custom clinical summary. Mention the patient's specific symptoms and your findings to justify the diagnosis. Every assessment MUST be unique to this specific encounter. 
      2. SUBJECTIVE: Capture the patient's exact concerns in professional English.
      3. OBJECTIVE: Record all vitals and examination findings mentioned.
      4. PLAN: Verbatim medicines (e.g., Dolo 650) and follow-up.
      5. NO REPETITION: Do not use the same phrasing across different patients or sections.

      STRUCTURE (JSON):
      {
        "patient_name": "NAME",
        "soap": {
          "subjective": [{"text": "...", "confidence": 100}],
          "objective": [{"text": "...", "confidence": 100}],
          "assessment": [{"text": "DYNAMC_UNIQUE_SUMMARY_HERE", "confidence": 100}],
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
        finalResult.intelligence.mode = "Gemini Narrative v6.0";
      }
    } catch (e) {
      console.warn("AI Engine slow, using Variety Fallback.");
    }

    // STEEL-CORE VARIETY FALLBACK
    const lowerTranscript = transcript.toLowerCase();
    const add = (section: string, text: string) => {
      if (!finalResult.soap[section].some((s: any) => s.text === text)) {
        finalResult.soap[section].push({ text, confidence: 95 });
      }
    };

    if (finalResult.soap.assessment.length === 0) {
      // Logic for Varied Fallback
      Object.values(CLINICAL_DICTIONARY.DISEASES).flat().forEach(d => {
        if (lowerTranscript.includes(d.toLowerCase())) {
          const variations = [
            `Presentation and symptoms align with a diagnosis of ${d}.`,
            `Observed clinical markers suggest an active case of ${d}.`,
            `Patient's history and vitals are indicative of ${d}.`,
            `Current clinical profile matches established patterns for ${d}.`
          ];
          add("assessment", variations[Math.floor(Math.random() * variations.length)]);
        }
      });
    }

    // VITALS (OBJECTIVE)
    const tempMatch = transcript.match(/(\d+)\s*(?:degree|temp|temperature)/i);
    if (tempMatch) add("objective", `Recorded core temperature of ${tempMatch[1]}°F.`);
    
    const bpMatch = transcript.match(/bp\s*(?:is|of)?\s*(\d+)/i);
    if (bpMatch) add("objective", `Hemodynamic status shows BP at ${bpMatch[1]} mmHg.`);

    // MEDICINES (PLAN)
    Object.values(CLINICAL_DICTIONARY.MEDICINES).flat().forEach(m => {
      if (lowerTranscript.includes(m.toLowerCase())) {
        add("plan", `Pharmacological intervention: Prescribed ${m}.`);
      }
    });

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("ENGINE ERROR:", error);
    return NextResponse.json({ 
      patient_name: null, 
      soap: { subjective: [{text: "Narrative Recovery Active.", confidence: 50}], objective: [], assessment: [], plan: [] }
    });
  }
}
