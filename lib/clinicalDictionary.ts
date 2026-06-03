export const CLINICAL_DICTIONARY = {
  ROLES: {
    DOCTOR: [
      "Doc", "Doctor", "Dr.", "Physician", "Specialist", "Clinician", "Surgeon",
      "Kaisi tabiyat hai", "Kya hua hai", "Kab se", "Medicine", "Checkup", "Report",
      "Kaya hota aahe", "Kadhi pasun", "Jeela kaay"
    ],
    PATIENT: [
      "Patient", "Client", "Subject", "Mera naam", "Mujhe dard hai", "Bukhar hai",
      "Headache", "Cough", "Cold", "Pain", "Takleef", "Problem", "Dukhne", "Traas"
    ]
  },
  DISEASES: {
    RESPIRATORY: ["Pneumonia", "Bronchitis", "Asthma", "COPD", "COVID-19", "Sinusitis", "Pharyngitis", "Tuberculosis", "Sardi", "Khokla", "Thandi", "Zukam", "Nazla"],
    METABOLIC: ["Diabetes Mellitus", "Sugar", "Hypertension", "BP", "Hypothyroidism", "Hyperlipidemia", "Obesity", "Anemia", "Kamzori"],
    CARDIAC: ["Angina", "Myocardial Infarction", "Heart Failure", "Arrhythmia", "Palpitations", "Heart Attack", "Chest Pain"],
    GASTRO: ["Gastritis", "GERD", "IBS", "Diarrhea", "Constipation", "Peptic Ulcer", "Acidity", "Julab", "Ultya", "Amoebiasis", "Gas", "Badhazmi", "Pet Safa", "Bawaseer", "Piles", "Pet Dard"],
    ORTHO: ["Arthritis", "Spondylitis", "Fracture", "Back Pain", "Sciatica", "Osteoporosis", "Kambar Dukhne", "Sande Dukhi", "Stiffness", "Gathiya", "Moch", "Kamar Dard"],
    DERMA: ["Eczema", "Psoriasis", "Dermatitis", "Acne", "Fungal Infection", "Rash", "Khaj", "Khandu", "Khajli", "Phunsi"],
    NEURO: ["Migraine", "Vertigo", "Stroke", "Lakwa", "Epilepsy", "Seizures", "Chakkar", "Mirgi", "Fit", "Sar Dard"],
    ENT: ["Otitis", "Tonsillitis", "Sinusitis", "Ear Pain", "Throat Infection", "Gala Kharash", "Kan Dukhne", "Gal Dukhne"],
    PEDS: ["Jaundice", "Kavila", "Colic", "Measles", "Mumps", "Chickenpox", "Piliya", "Khasra"],
    GENERAL: ["Viral Fever", "Typhoid", "Chikungunya", "Dengue", "Malaria", "UTI", "Leptospirosis", "Allergy", "Pathri", "Stone", "Motiyabind"]
  },
  MEDICINES: {
    ANTIBIOTICS: ["Amoxicillin", "Azithromycin", "Ciprofloxacin", "Cefixime", "Augmentin", "Doxycycline", "Taxim-O", "Zithrox", "Zifi", "Monocef", "Metrogyl"],
    PAINKILLERS: ["Paracetamol", "Ibuprofen", "Diclofenac", "Naproxen", "Tramadol", "Combiflam", "Aceclofenac", "Voveran", "Dolo 650", "Calpol", "Ultracet", "Spasmo-Proxyvon", "Saridon", "Disprin", "Crocin", "Dynapar"],
    GASTRO_DRUGS: ["Pantoprazole", "Omeprazole", "Ranitidine", "Digene", "Domperidone", "Pan-D", "Omez", "Gelusil", "Librax", "Eno", "Pudin Hara", "Kayam Churna"],
    DIABETIC: ["Metformin", "Glimiperide", "Insulin", "Sitagliptin", "Glycomet", "Jalra", "Galvus"],
    CARDIAC_DRUGS: ["Amlodipine", "Telmisartan", "Atorvastatin", "Aspirin", "Clopidogrel", "Telma", "Ecosprin", "Rosuvas"],
    RESPIRATORY_DRUGS: ["Asthalin", "Montelukast", "Levocetirizine", "Ascoril", "Benadryl", "Montek-LC", "Alex", "Wikoryl", "Solvin Cold", "Vicks", "Strepsils", "Cofils"],
    SUPPLEMENTS: ["Limcee", "Shelcal", "Evion", "Neurobion", "Liv-52", "Zincovit", "Becosules", "Uprise-D3", "Revital"],
    TOPICAL: ["Moov", "Volini", "Iodex", "Boroline", "Betadine", "Omnigel"]
  },
  SYMPTOMS: [
    "Fever", "Bukhar", "Taap", "Cough", "Khansi", "Khokla", "Pain", "Dard", "Dukhne",
    "Shortness of breath", "Dam lagne", "Vomiting", "Ultya", "Nausea", "Malkham",
    "Dizziness", "Chakkar", "Fatigue", "Thakwa", "Weakness", "Ashaktapana", "Kamzori",
    "Itching", "Khaj", "Swelling", "Souj", "Stiffness", "Jakadlela", "Burning", "Jalan",
    "Numbness", "Mungya", "Blurred Vision", "Dhunkle", "Weight Loss", "Vajan Kami",
    "Bechaini", "Ghabrahat", "Sujan", "Khajli", "Pet Kharab", "Sardi", "Zukam",
    "Sar Dard", "Kamar Dard", "Pet Dard", "Gal Dukhne"
  ],
  EXAM_TERMS: [
    "Tenderness", "Palpation", "Auscultation", "Dullness", "Normal Vitals", "Inflammation",
    "Clear lungs", "Abdominal mass", "Stable", "Guarding", "Rigidity", "Degree", "Degrees", "Fahrenheit"
  ]
};

export const ICD10_CODES: Record<string, string> = {
  "Viral Infection": "B34.9",
  "Viral Fever": "B34.9",
  "Pneumonia": "J18.9",
  "Bronchitis": "J40",
  "Asthma": "J45.909",
  "COPD": "J44.9",
  "COVID-19": "U07.1",
  "Sinusitis": "J01.90",
  "Pharyngitis": "J02.9",
  "Tuberculosis": "A15.9",
  "Diabetes Mellitus": "E11.9",
  "Hypertension": "I10",
  "Hypothyroidism": "E03.9",
  "Hyperlipidemia": "E78.5",
  "Obesity": "E66.9",
  "Anemia": "D64.9",
  "Gastritis": "K29.70",
  "GERD": "K21.9",
  "IBS": "K58.9",
  "Diarrhea": "R19.7",
  "Constipation": "K59.00",
  "Peptic Ulcer": "K27.9",
  "Arthritis": "M19.90",
  "Spondylitis": "M46.90",
  "Fracture": "T14.8",
  "Sciatica": "M54.30",
  "Osteoporosis": "M81.0",
  "Eczema": "L30.9",
  "Psoriasis": "L40.9",
  "Dermatitis": "L30.9",
  "Acne": "L70.0",
  "Migraine": "G43.909",
  "Vertigo": "R42",
  "Stroke": "I64",
  "Epilepsy": "G40.909",
  "Seizure Disorder": "G40.909",
  "Typhoid": "A01.00",
  "Dengue": "A90",
  "Malaria": "B54",
  "UTI": "N39.0",
  "Allergy": "T78.40"
};
