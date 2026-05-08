export interface TranscriptLine {
  id: string;
  speaker: "Clinician" | "Patient";
  text: string;
  timestamp: string;
  mappedTerm?: string;
}

export interface SOAPNote {
  subjective: { text: string; sourceId: string; term?: string }[];
  objective: string[];
  assessment: string[];
  plan: string[];
  icdCodes: string[];
  cptCodes: string[];
  differentials: string[];
  patientEducation: string;
  gaps: string[];
}

export const rawTranscript: TranscriptLine[] = [
  { id: "t1", speaker: "Patient", text: "Doc, I've had this nagging cough for two weeks. It gets worse at night.", timestamp: "00:05", mappedTerm: "nagging cough" },
  { id: "t2", speaker: "Patient", text: "No fever, but I feel short of breath when I walk to the kitchen.", timestamp: "00:15", mappedTerm: "exertional dyspnea" },
  { id: "t3", speaker: "Clinician", text: "Okay. Let's check your lungs...", timestamp: "00:30" },
  { id: "t4", speaker: "Clinician", text: "Lungs are clear on auscultation. I'll start you on an albuterol inhaler, 2 puffs every 4 hours.", timestamp: "00:45" },
];

export const nexusSOAPData: SOAPNote = {
  subjective: [
    { text: "Non-productive cough x14 days, nocturnal worsening.", sourceId: "t1", term: "nagging cough" },
    { text: "Positive for exertional dyspnea ('short of breath when I walk to the kitchen').", sourceId: "t2", term: "exertional dyspnea" },
    { text: "Negative for febrile illness.", sourceId: "t2" }
  ],
  objective: [
    "Lungs: Clear to auscultation bilaterally.",
    "General: No acute distress noted."
  ],
  assessment: [
    "Cough, unspecified.",
    "Dyspnea on exertion.",
    "Rule out: Asthma (J45.909), Bronchitis."
  ],
  plan: [
    "Albuterol HFA inhaler: 2 puffs every 4 hours PRN.",
    "Follow up in 1 week if symptoms persist.",
    "Refer for pulmonary function tests (PFTs)."
  ],
  icdCodes: ["J45.909 (Unspecified asthma)", "R05.9 (Cough, unspecified)"],
  cptCodes: ["99213 (Office visit, level 3)", "94640 (Inhalation treatment)"],
  differentials: [
    "Asthma",
    "Gastroesophageal Reflux Disease (GERD)",
    "Post-nasal drip",
    "Congestive Heart Failure (CHF)"
  ],
  patientEducation: "You have a cough that is worse at night and makes you short of breath. We are giving you a breathing medicine called an inhaler to help open your lungs. Use it every 4 hours if you need it.",
  gaps: ["Clarification Required: Underlying Diagnosis (Asthma vs. Bronchitis) not explicitly stated by clinician."]
};
