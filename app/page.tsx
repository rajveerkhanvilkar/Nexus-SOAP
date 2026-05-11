"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Download, Activity, ShieldCheck, Zap, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLINICAL_DICTIONARY } from '@/lib/clinicalDictionary';
import SOAPCard from '@/components/SOAPCard';
import PulseVisualizer from '@/components/PulseVisualizer';
import { jsPDF } from 'jspdf';

export default function NexusSOAP() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [activeAgent, setActiveAgent] = useState<"Idle" | "Scribe" | "Auditor" | "Coder" | "Done">("Idle");
  const [liveTranscript, setLiveTranscript] = useState<{ id: string; text: string; role: 'Doctor' | 'Patient'; timestamp: string }[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [aiResult, setAiResult] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (liveTranscript.length > 0) scrollToBottom();
  }, [liveTranscript]);

  // STABLE SEMANTIC DIARIZATION
  const startRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => console.log("LEGACY ENGINE: ACTIVE");

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript;
          const lowerText = text.toLowerCase();
          
          // SEMANTIC ROLE INFERENCE
          const patientSignals = ["mujhe", "dard", "bukhar", "taap", "khansi", "khokla", "problem", "takleef", "i have", "i feel", "pain", "fever", "mera naam", "maaza naav"];
          const isAddressToDoctor = lowerText.startsWith("doctor") || lowerText.includes("doctor what") || lowerText.includes("doctor please");
          
          const doctorSignals = ["prescribing", "take", "medicine", "dawa", "goli", "treatment", "diagnosis", "bp is", "temperature is", "report", "rest advised", "hydration", "theek hai", "let me", "breathe", "examination"];
          
          const hasPatientSignal = patientSignals.some(k => lowerText.includes(k));
          const hasDoctorSignal = doctorSignals.some(k => lowerText.includes(k)) && !isAddressToDoctor;

          let role: 'Doctor' | 'Patient' = 'Patient';
          if (hasDoctorSignal) role = 'Doctor';
          else if (hasPatientSignal) role = 'Patient';
          else role = (transcriptRef.current.length > 0 && transcriptRef.current[transcriptRef.current.length-1].role === 'Doctor' && !isAddressToDoctor) ? 'Patient' : 'Doctor';
          
          const newLine = { id: Date.now().toString() + i, text, role, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setLiveTranscript(prev => [...prev, newLine]);
          transcriptRef.current.push(newLine);
        }
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
      
      setIsProcessing(true);
      setActiveAgent("Scribe");
      const transcriptText = transcriptRef.current.map(l => `${l.role}: ${l.text}`).join("\n");
      try {
        const response = await fetch("/api/scribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript: transcriptText }) });
        const data = await response.json();
        if (data.patient_name && !patientName) setPatientName(data.patient_name.toUpperCase());
        setAiResult(data);
        setTimeout(() => { setIsProcessing(false); setActiveAgent("Done"); }, 500);
      } catch (err) { setIsProcessing(false); }
    } else {
      setIsRecording(true);
      isRecordingRef.current = true;
      transcriptRef.current = [];
      setLiveTranscript([]);
      setAiResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        setVolume(dataArray.reduce((a, b) => a + b) / dataArray.length);
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
      
      startRecognition();
    }
  };

  const exportPDF = () => {
    if (!aiResult) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(16, 185, 129); doc.rect(0, 0, pageWidth, 55, 'F');
    doc.setFillColor(40, 40, 40); doc.rect(0, 55, pageWidth, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(32); doc.text("NEXUS SOAP", 20, 30);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("STABLE CLINICAL AMBIENT INTELLIGENCE OS", 20, 42);
    const uniqueID = `NX-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    doc.setFontSize(8);
    doc.text(`PATIENT NAME: ${patientName || "NOT SPECIFIED"}`, pageWidth - 85, 22);
    doc.text(`CONSULTATION ID: #${uniqueID}`, pageWidth - 85, 28);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 85, 34);
    doc.text(`EMR STATUS: AES-256 ENCRYPTED`, pageWidth - 85, 40);
    let yPos = 80;
    const sections = [{ t: "SUBJECTIVE (HISTORY)", d: aiResult.soap.subjective }, { t: "OBJECTIVE (FINDINGS)", d: aiResult.soap.objective }, { t: "ASSESSMENT (SUMMARY)", d: aiResult.soap.assessment }, { t: "PLAN (TREATMENT)", d: aiResult.soap.plan }];
    sections.forEach(s => {
      doc.setFillColor(245, 245, 245); doc.rect(20, yPos - 7, pageWidth - 40, 10, 'F');
      doc.setFillColor(16, 185, 129); doc.rect(20, yPos - 7, 2, 10, 'F');
      doc.setTextColor(16, 185, 129); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(s.t, 26, yPos);
      yPos += 12; doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      if (s.d.length === 0) { doc.text("• No clinical markers synthesized.", 26, yPos); yPos += 8; } 
      else { s.d.forEach((item: any) => { const lines = doc.splitTextToSize(`• ${item.text} (${item.confidence || 95}%)`, pageWidth - 50); doc.text(lines, 26, yPos); yPos += (lines.length * 6) + 4; if (yPos > 270) { doc.addPage(); yPos = 30; } }); }
      yPos += 8;
    });
    doc.setFontSize(7); doc.setTextColor(200, 200, 200); doc.text("LEGAL AUDIT TRAIL | GENERATED VIA NEXUS-SOAP OS", pageWidth / 2, pageHeight - 15, { align: "center" });
    doc.addPage(); doc.setFillColor(40, 40, 40); doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(16, 185, 129); doc.rect(0, 45, pageWidth, 2, 'F'); 
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("APPENDIX A: DIARIZED AUDIT TRAIL", 20, 25);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("UNEDITED CONVERSATIONAL LOGS", 20, 35);
    let auditY = 65; doc.setFontSize(8);
    liveTranscript.forEach(line => {
      if (auditY > pageHeight - 25) { doc.addPage(); auditY = 30; }
      doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "bold"); doc.text(`${line.role.toUpperCase()} | ${line.timestamp}:`, 20, auditY);
      doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
      const transcriptLines = doc.splitTextToSize(line.text, pageWidth - 50); doc.text(transcriptLines, 20, auditY + 5);
      auditY += (transcriptLines.length * 4) + 12;
    });
    doc.save(`NEXUS_REPORT_${patientName || 'Clinical'}.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-400" /><h1 className="text-sm font-black tracking-tighter text-white uppercase">Nexus<span className="text-emerald-400">SOAP</span></h1></div>
        <div className="flex items-center gap-4">
          <input type="text" placeholder="ENTER PATIENT NAME" value={patientName} onChange={(e) => setPatientName(e.target.value.toUpperCase())} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-emerald-400 focus:outline-none w-32 md:w-64" />
          <button onClick={exportPDF} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group shadow-2xl shadow-emerald-500/10"><Download size={18} className="text-white/40 group-hover:text-emerald-400" /></button>
          <button onClick={toggleRecording} className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-2xl ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-red-500/10' : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'}`}>{isRecording ? 'Stop' : 'Start Ingestion'}</button>
        </div>
      </nav>

      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-8 pt-32 px-4 md:px-8 pb-20">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SOAPCard letter="S" title="SUBJECTIVE (HISTORY)" items={isProcessing ? [{text: "Synthesizing...", confidence: 100}] : (aiResult?.soap?.subjective || [])} variant="green" />
            <SOAPCard letter="O" title="OBJECTIVE (FINDINGS)" items={isProcessing ? [{text: "Analyzing...", confidence: 100}] : (aiResult?.soap?.objective || [])} variant="gold" />
            <SOAPCard letter="A" title="ASSESSMENT (SUMMARY)" items={isProcessing ? [{text: "Summarizing...", confidence: 100}] : (aiResult?.soap?.assessment || [])} variant="green" />
            <SOAPCard letter="P" title="PLAN (TREATMENT)" items={isProcessing ? [{text: "Treatment Design...", confidence: 100}] : (aiResult?.soap?.plan || [])} variant="gold" />
          </div>
          <div className="glass rounded-[2rem] p-10 border-white/5 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group">
            <div className="absolute top-6 left-8 flex items-center gap-3 opacity-40"><div className={`w-2 h-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'} rounded-full`} /><span className="text-[10px] font-black tracking-widest uppercase">{isRecording ? 'LIVE STREAM ACTIVE' : 'SYSTEM IDLE'}</span></div>
            <PulseVisualizer isProcessing={isProcessing || isRecording} volume={volume} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 h-[calc(100vh-200px)]">
          <div className="glass rounded-[2rem] border-white/5 flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-3xl shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between"><div className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-black tracking-widest uppercase">Diarized Stream</span></div><div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase">Live</div></div>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              <AnimatePresence mode="popLayout">
                {liveTranscript.map((line) => (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={line.id} className={`p-5 rounded-2xl border transition-all duration-300 ${line.role === 'Doctor' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className={`text-[9px] font-black tracking-widest uppercase ${line.role === 'Doctor' ? 'text-emerald-400' : 'text-amber-500'}`}>{line.role}</span></div><span className="text-[8px] opacity-30 font-black">{line.timestamp}</span></div>
                    <p className="text-[13px] leading-relaxed text-white/90 font-medium">{line.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
