/**
 * NEXUS-SOAP HYPER-DICTIONARY v4.5
 * High-Density Multilingual Clinical Lexicon
 */

export const CLINICAL_DICTIONARY = {
  SYMPTOMS: {
    COUGH_RESPIRATORY: {
      en: ["cough", "dry cough", "expectoration", "wheezing", "shortness of breath", "dyspnea", "phlegm", "congestion"],
      hi: ["khasi", "khansi", "balgham", "saans lene me takleef", "seena baith gaya", "khokla", "gala kharab"],
      mr: ["khokla", "shwas ghyayla traas", "kaf", "gala dukhtay", "thasi", "ghasa dharne"]
    },
    FEVER_CHILLS: {
      en: ["fever", "temperature", "chills", "rigors", "shivering", "sweating", "febrile", "body aches"],
      hi: ["bukhar", "tap", "thand lagna", "shirhan", "ang garam", "feverish", "kamkpani"],
      mr: ["tap", "thandi vajne", "ang garam hone", "bharat tap", "angani garami", "taap"]
    },
    PAIN_GENERAL: {
      en: ["pain", "ache", "soreness", "throbbing", "stabbing", "burning sensation", "discomfort", "tenderness"],
      hi: ["dard", "dukhna", "jalan", "chubhan", "sujan", "bhari-pan", "meetha dard"],
      mr: ["dukhne", "vedana", "kasasri hone", "chamka marne", "kad yete", "kasatarach hotay"]
    },
    HEAD_NEURO: {
      en: ["headache", "migraine", "dizziness", "vertigo", "seizures", "confusion", "fainting", "numbness"],
      hi: ["sar dard", "sir dukhta", "chakkar", "behosh", "sann-pana", "aadha sish", "ghoomna"],
      mr: ["doke dukhne", "chakkar yene", "shunya hone", "doke ghumne", "bhram", "murcha"]
    },
    GASTRO_INTESTINAL: {
      en: ["stomach pain", "nausea", "vomiting", "diarrhea", "constipation", "bloating", "acidity", "indigestion"],
      hi: ["pet dard", "ulti", "vomit", "loose motion", "kabz", "gas", "jalan", "pet saaf nahi"],
      mr: ["pot dukhne", "omiti yene", "sandas", "potat gola", "pachana cha tras", "pot fugne"]
    },
    WEAKNESS_FATIGUE: {
      en: ["weakness", "fatigue", "lethargy", "tiredness", "exhaustion", "low energy", "drowsiness"],
      hi: ["kamzori", "thakan", "susty", "energy nahi hai", "nidhal", "sust", "neend aana"],
      mr: ["ashaktpana", "thakava", "glani yene", "jhop yene", "jiv ghabarane", "ashakti"]
    }
  },
  ROLES: {
    DOCTOR: [
      // English
      "take", "prescription", "follow-up", "diagnosis", "dosage", "twice a day", "empty stomach", 
      "examine", "report", "blood test", "x-ray", "advice", "observation", "stable", "critical",
      "symptoms suggest", "protocol", "recovery", "hydration", "rest", "avoid", "liquid diet",
      "how long", "since when", "did you", "have you",
      // Hinglish/Mixed (Aggressive Triggers & Interviewing)
      "le lo", "lo", "kha lo", "pi lo", "theek ho jaega", "test karwana padega", "dawa likh raha hoon", 
      "check-up", "report dikhao", "parhez", "goli lo", "drops daalo", "ointment lagao", "sirup peena",
      "khaya tha", "hua tha", "kab se", "kya", "kaise", "kab",
      // Marathi-English
      "ghya", "ghyava", "tapasni karavi lagel", "aushadh gya", "pathyapanya", "virechan", "ahaval", "tapasun baghto",
      "kadhi pasun", "kay", "kasa"
    ],
    PATIENT: [
      // English
      "feeling", "since", "last night", "hurts", "problem", "started when", "suffering", "uncomfortable",
      "not sleeping", "no appetite", "weight loss", "cannot walk", "vision blurry", "heavy breathing",
      // Hinglish/Mixed
      "mujhe", "mera", "pareshani", "takleef", "dard ho raha", "badh gaya hai", "shuru hua",
      "medicine li thi", "relief nahi hai", "kafi dinon se", "achanak",
      // Marathi-English
      "mala", "maza", "traas hotoy", "dukhayala laglay", "kadhi pasun", "bara vhat nahi", "khupach"
    ]
  },
  DURATION_MARKERS: [
    "days", "weeks", "months", "hours", "din se", "hafte se", "mahine se", "kal se", "aaj se", "pasun"
  ],
  SEVERITY_MARKERS: [
    "severe", "mild", "moderate", "bahut zyada", "halka", "thoda sa", "khupch", "thodese"
  ]
};
