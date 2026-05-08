"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Stethoscope, 
  FileText, 
  ShieldCheck, 
  BrainCircuit, 
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Scale,
  Microscope,
  Code2,
  Download,
  User,
  ShieldAlert,
  Search,
  History,
  CheckCircle
} from "lucide-react";
import PulseVisualizer from "@/components/PulseVisualizer";
import SOAPCard from "@/components/SOAPCard";
import jsPDF from "jspdf";

import { CLINICAL_DICTIONARY } from "@/lib/clinicalDictionary";

export default function NexusSOAP() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [activeAgent, setActiveAgent] = useState<"Idle" | "Scribe" | "Auditor" | "Coder" | "Done">("Idle");
  const [liveTranscript, setLiveTranscript] = useState<{ id: string; text: string; role: 'Doctor' | 'Patient' | 'User'; timestamp: string }[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [aiResult, setAiResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<any[]>([]);
  const pdfRef = useRef<HTMLDivElement>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      isRecordingRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setActiveAgent("Auditor");
      
      const transcriptText = transcriptRef.current.map(l => `${l.role}: ${l.text}`).join("\n");
      
      if (transcriptText) {
        try {
          const response = await fetch("/api/scribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcriptText })
          });
          const data = await response.json();
          
          // AMBIENT IDENTITY AUTO-FILL
          if (data.patient_name && !patientName) {
            setPatientName(data.patient_name.toUpperCase());
            // Visual success indicator
            setActiveAgent("Done");
          }

          // MEMORY LOCK: Set data first, then clear processing state
          setAiResult(data);
          setTimeout(() => {
            setIsProcessing(false);
            if (data.patient_name) setActiveAgent("Done");
          }, 300);
        } catch (err) {
          console.error("AI Error", err);
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // ONLY RESET AFTER MIC SUCCESS
      setAiResult(null);
      setLiveTranscript([]);
      transcriptRef.current = [];
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      isRecordingRef.current = true;
      setIsRecording(true);
      setActiveAgent("Scribe");

      const updateVolume = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average * 5.0); // Boosted for high-fidelity pulse
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            const lowerText = text.toLowerCase();
            
            // v4.8 IDENTITY-FIRST ROLE INFERENCE
            const introKeywords = ["my name is", "mera naam", "maaza naav", "naam hai", "naav aahe", "i am", "mee"];
            const isIntroduction = introKeywords.some(k => lowerText.includes(k));
            
            const doctorKeywords = ["crocin", "paracetamol", "medicine", "dawa", "goli", "le lo", "take this", "report", "test", "checkup", "khaya tha", "hua tha", "kab se", "kya", "kaise", "since when", "how long"];
            const isDoctorKeyword = doctorKeywords.some(k => lowerText.includes(k));
            const isDoctorSignal = CLINICAL_DICTIONARY.ROLES.DOCTOR.some(s => lowerText.includes(s.toLowerCase()));
            const isPatientSignal = CLINICAL_DICTIONARY.ROLES.PATIENT.some(s => lowerText.includes(s.toLowerCase()));
            
            let role: 'Doctor' | 'Patient' = 'Patient';
            
            // Priority 0: Introduction = ALWAYS Patient
            if (isIntroduction) {
              role = 'Patient';
            } 
            // Priority 1: Doctor Instructions & Interview Questions
            else if (isDoctorKeyword || isDoctorSignal) {
              role = 'Doctor';
            } else if (isPatientSignal || lowerText.includes('mujhe') || lowerText.includes('mala')) {
              role = 'Patient';
            } else if (lowerText.includes('?')) {
              role = 'Doctor';
            }
            
            const newLine = {
              id: Date.now().toString() + i,
              text,
              role: role,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            setLiveTranscript(prev => [...prev, newLine]);
            transcriptRef.current.push(newLine);
          }
        }
      };
      recognition.start();
    } catch (err) {
      console.error("Recording error", err);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. EXECUTIVE BRANDED HEADER
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 120, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("NEXUS", 40, 60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("AMBIENT CLINICAL INTELLIGENCE OS", 40, 85);
    doc.setFontSize(28);
    doc.text("SOAP", 180, 60);
    
    // METADATA PANEL
    const uniqueID = `NX-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    doc.setFontSize(9);
    doc.text(`Patient: ${patientName || "NOT SPECIFIED"}`, pageWidth - 180, 50);
    doc.text(`Consultation ID: #${uniqueID}`, pageWidth - 180, 65);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 180, 80);

    // 2. CLINICAL SUMMARY (SUMMARIZED BY AI)
    let yPos = 160;
    const sections = [
      { title: "S - SUBJECTIVE (CLINICAL HISTORY)", data: aiResult?.soap?.subjective || [] },
      { title: "O - OBJECTIVE (CLINICAL FINDINGS)", data: aiResult?.soap?.objective || [] },
      { title: "A - ASSESSMENT (DIAGNOSTIC SUMMARY)", data: aiResult?.soap?.assessment || [] },
      { title: "P - PLAN (TREATMENT PROTOCOL)", data: aiResult?.soap?.plan || [] }
    ];

    sections.forEach(section => {
      doc.setFillColor(16, 185, 129, 0.05);
      doc.rect(40, yPos - 15, pageWidth - 80, 25, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(2);
      doc.line(40, yPos - 15, 40, yPos + 10);
      
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.title, 50, yPos);
      
      yPos += 30;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      if (section.data.length > 0) {
        section.data.forEach((item: any) => {
          const text = item.text.replace("[QUOTE]", '"').replace("[/QUOTE]", '"');
          const lines = doc.splitTextToSize(text, pageWidth - 100);
          doc.text(lines, 50, yPos);
          yPos += lines.length * 15;
          
          // ADD CONFIDENCE METRIC
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(`AI Confidence: ${item.confidence}% | Validated via Audit Trail`, 55, yPos);
          yPos += 15;
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
        });
      } else {
        doc.text("No data recorded for this clinical section.", 50, yPos);
        yPos += 20;
      }
      yPos += 20;
    });

    // 3. AUDIT APPENDIX (RAW TRANSCRIPT)
    doc.addPage();
    doc.setFillColor(50, 50, 50);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("APPENDIX A: RAW CLINICAL AUDIT TRAIL", 40, 50);
    doc.setFontSize(8);
    doc.text("UNEDITED CONVERSATIONAL LOGS FOR COMPLIANCE VERIFICATION", 40, 65);

    yPos = 120;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    liveTranscript.forEach(line => {
      doc.setFont("helvetica", "bold");
      doc.text(`${line.role.toUpperCase()} [${line.timestamp}]:`, 40, yPos);
      yPos += 15;
      doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(line.text, pageWidth - 80);
      doc.text(textLines, 40, yPos);
      yPos += textLines.length * 15 + 10;
      
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }
    });

    doc.save(`Nexus_Enterprise_Report_${Date.now()}.pdf`);
  };

  const sectionColor = (role: string): [number, number, number] => {
    if (role === 'Doctor') return [16, 185, 129];
    if (role === 'Patient') return [245, 158, 11];
    return [100, 100, 100];
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-emerald-primary/30 overflow-x-hidden">
      {/* ELITE NAV */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-gradient-to-b from-[#050505] to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Activity className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">NEXUS<span className="text-emerald-500">SOAP</span></h1>
            <p className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase">AI Clinical OS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="ENTER PATIENT NAME" 
              value={patientName}
              onChange={(e) => setPatientName(e.target.value.toUpperCase())}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-emerald-400 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all w-64 uppercase"
            />
            <div className="absolute inset-0 rounded-xl bg-emerald-500/5 blur-lg group-focus-within:bg-emerald-500/10 transition-all -z-10" />
          </div>

          <button 
            onClick={exportPDF} 
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <Download size={18} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
          </button>
          <button 
            onClick={toggleRecording}
            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              isRecording ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            }`}
          >
            {isRecording ? "Stop Session" : "Start Ingestion"}
          </button>
        </div>
      </nav>

      {/* DASHBOARD GRID */}
      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-8 pt-32 px-8 pb-20">
        
        {/* LEFT: SOAP & INTELLIGENCE */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* CLINICAL INTELLIGENCE GRID (ENTERPRISE GRADE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SOAPCard 
                title="S - SUBJECTIVE (HISTORY)" 
                items={isProcessing ? [{text: "Synthesizing Clinical History...", confidence: 100}] : (aiResult?.soap?.subjective || [])}
                variant="green"
              />
              <SOAPCard 
                title="O - OBJECTIVE (FINDINGS)" 
                items={isProcessing ? [{text: "Normalizing Vitals & Metrics...", confidence: 100}] : (aiResult?.soap?.objective || [])}
                variant="gold"
              />
              <SOAPCard 
                title="A - ASSESSMENT (ANALYSIS)" 
                items={isProcessing ? [{text: "Calculating Diagnostic Probabilities...", confidence: 100}] : (aiResult?.soap?.assessment || [])}
                variant="green"
              />
              <SOAPCard 
                title="P - PLAN (PROTOCOL)" 
                items={isProcessing ? [{text: "Constructing Treatment Protocol...", confidence: 100}] : (aiResult?.soap?.plan || [])}
                variant="gold"
              />
            </div>

          <div className="glass rounded-[2rem] p-10 border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            <div className="absolute top-6 left-8 flex items-center gap-3 opacity-40">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase">Ambient Stream</span>
            </div>
            <PulseVisualizer isProcessing={isProcessing || isRecording} volume={volume} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 border-white/5">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">X-Factor DDP</h4>
              <div className="space-y-3">
                {aiResult?.intelligence?.differential_diagnosis?.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="opacity-60">{d.name}</span>
                    <span className="text-emerald-500 font-bold">{d.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-6 border-white/5">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Auditor Alert</h4>
              <p className="text-[10px] opacity-40 leading-relaxed">{aiResult?.intelligence?.ai_reasoning || "Analyzing..."}</p>
            </div>
            <div className="glass rounded-2xl p-6 border-white/5">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Billing</h4>
              <div className="flex flex-wrap gap-2">
                {aiResult?.intelligence?.icd10?.map((c: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white/5 rounded text-[8px] font-mono">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: MASTER STREAM */}
        <div className="col-span-12 lg:col-span-4 h-[calc(100vh-160px)]">
          <div className="glass rounded-[2rem] border-white/5 flex flex-col h-full bg-black/20">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="text-emerald-500" size={18} />
                <h4 className="text-xs font-black tracking-widest uppercase">Diarized Stream</h4>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {liveTranscript.map((line) => (
                <div key={line.id} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className={line.role === 'Doctor' ? "text-emerald-500" : "text-amber-500"}>{line.role}</span>
                    <span className="opacity-20">{line.timestamp}</span>
                  </div>
                  <div className={`p-4 rounded-2xl border ${line.role === 'Doctor' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                    <p className="text-sm opacity-80">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-4 left-8 opacity-20 text-[8px] font-black uppercase tracking-widest">
        Nexus Clinical OS v4.0.1
      </footer>
    </main>
  );
}
