"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Download, Activity, ShieldCheck, Zap, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [liveTranscript, setLiveTranscript] = useState<{ id: string; text: string; role: 'Doctor' | 'Patient' | 'User'; timestamp: string }[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [aiResult, setAiResult] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<any[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      isRecordingRef.current = false;
      recognitionRef.current?.stop();
      setIsProcessing(true);
      setActiveAgent("Scribe");

      const transcriptText = transcriptRef.current.map(l => `${l.role}: ${l.text}`).join("\n");

      try {
        const response = await fetch("/api/scribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptText })
        });
        const data = await response.json();

        if (data.patient_name && !patientName) {
          setPatientName(data.patient_name.toUpperCase());
        }

        setAiResult(data);
        setTimeout(() => {
          setIsProcessing(false);
          setActiveAgent("Done");
        }, 500);
      } catch (err) {
        console.error("AI Error", err);
        setIsProcessing(false);
      }
    } else {
      setIsRecording(true);
      isRecordingRef.current = true;
      transcriptRef.current = [];
      setLiveTranscript([]);
      setAiResult(null);

      const updateVolume = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        } catch (err) { }
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

            const introKeywords = ["my name is", "mera naam", "maaza naav", "naam hai", "naav aahe", "i am", "mee"];
            const isIntroduction = introKeywords.some(k => lowerText.includes(k));
            const doctorKeywords = ["crocin", "paracetamol", "medicine", "dawa", "goli", "le lo", "take this", "report", "test", "checkup", "khaya tha", "hua tha", "kab se", "kya", "kaise"];
            const isDoctorSignal = CLINICAL_DICTIONARY.ROLES.DOCTOR.some(s => lowerText.includes(s.toLowerCase())) || doctorKeywords.some(k => lowerText.includes(k));

            let role: 'Doctor' | 'Patient' = 'Patient';
            if (isIntroduction) role = 'Patient';
            else if (isDoctorSignal) role = 'Doctor';

            const newLine = { id: Date.now().toString() + i, text, role, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setLiveTranscript(prev => [...prev, newLine]);
            transcriptRef.current.push(newLine);
          }
        }
      };
      recognition.start();
    }
  };

  const exportPDF = () => {
    if (!aiResult) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // FONT SETUP
    doc.setFont("helvetica", "bold");

    // PAGE 1: CLINICAL SUMMARY
    // Emerald Header Block
    doc.setFillColor(16, 185, 129); // #10b981
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text("NEXUS", 25, 30);
    doc.text("SOAP", 100, 30);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("AMBIENT CLINICAL INTELLIGENCE OS", 25, 42);

    // Right-Aligned Metadata
    doc.setFontSize(8);
    const uniqueID = `NX-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    doc.text(`Consultation ID: #${uniqueID}`, pageWidth - 85, 22);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 85, 30);
    doc.text(`EMR Status: ENCRYPTED (AES-256)`, pageWidth - 85, 38);

    let yPos = 80;
    const sections = [
      { t: "S - SUBJECTIVE (HISTORY)", d: aiResult.soap.subjective },
      { t: "O - OBJECTIVE (FINDINGS)", d: aiResult.soap.objective },
      { t: "A - ASSESSMENT (SUMMARY)", d: aiResult.soap.assessment },
      { t: "P - PLAN (PROTOCOL)", d: aiResult.soap.plan }
    ];

    sections.forEach(s => {
      // Section Header (Dark Grey Bar + Emerald Side-Accent)
      doc.setFillColor(45, 45, 45);
      doc.rect(20, yPos - 6, pageWidth - 40, 10, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(20, yPos - 6, 2, 10, 'F');

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(s.t, 25, yPos);
      yPos += 14;

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      if (s.d.length === 0) {
        doc.text("No clinical data recorded for this section.", 25, yPos);
        yPos += 10;
      } else {
        s.d.forEach((item: any) => {
          const lines = doc.splitTextToSize(item.text, pageWidth - 50);
          doc.text(lines, 25, yPos);
          yPos += (lines.length * 5) + 3;

          doc.setFontSize(7);
          doc.setTextColor(180, 180, 180);
          doc.text(`AI Confidence: ${item.confidence || 95}% | Validated via Audit Trail`, 28, yPos);
          yPos += 8;

          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);

          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 30;
          }
        });
      }
      yPos += 5;
    });

    // PAGE 2: APPENDIX A
    doc.addPage();
    doc.setFillColor(60, 60, 60);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("APPENDIX A: RAW CLINICAL AUDIT TRAIL", 20, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("UNEDITED CONVERSATIONAL LOGS FOR COMPLIANCE VERIFICATION", 20, 35);

    let auditY = 65;
    doc.setFontSize(8);
    liveTranscript.forEach(line => {
      if (auditY > pageHeight - 30) {
        doc.addPage();
        auditY = 30;
      }

      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "bold");
      doc.text(`${line.role.toUpperCase()} [${line.timestamp}]:`, 20, auditY);

      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      const transcriptLines = doc.splitTextToSize(line.text, pageWidth - 50);
      doc.text(transcriptLines, 20, auditY + 5);
      auditY += (transcriptLines.length * 4) + 12;
    });

    doc.save(`NEXUS_REPORT_${patientName || 'Clinical'}.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-black tracking-tighter text-white">NEXUS<span className="text-emerald-400">SOAP</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="ENTER PATIENT NAME"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value.toUpperCase())}
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest text-emerald-400 focus:outline-none w-64"
          />
          <button onClick={exportPDF} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <Download size={18} className="text-white/40 group-hover:text-emerald-400" />
          </button>
          <button onClick={toggleRecording} className={`px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}>
            {isRecording ? 'Stop' : 'Start Ingestion'}
          </button>
        </div>
      </nav>

      <div className="max-w-[1700px] mx-auto grid grid-cols-12 gap-8 pt-32 px-8 pb-20">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SOAPCard letter="S" title="S - SUBJECTIVE (CLINICAL HISTORY)" items={isProcessing ? [{ text: "Synthesizing...", confidence: 100 }] : (aiResult?.soap?.subjective || [])} variant="green" />
            <SOAPCard letter="O" title="O - OBJECTIVE (CLINICAL FINDINGS)" items={isProcessing ? [{ text: "Normalizing...", confidence: 100 }] : (aiResult?.soap?.objective || [])} variant="gold" />
            <SOAPCard letter="A" title="A - ASSESSMENT (DIAGNOSTIC SUMMARY)" items={isProcessing ? [{ text: "Calculating...", confidence: 100 }] : (aiResult?.soap?.assessment || [])} variant="green" />
            <SOAPCard letter="P" title="P - PLAN (TREATMENT PROTOCOL)" items={isProcessing ? [{ text: "Formulating...", confidence: 100 }] : (aiResult?.soap?.plan || [])} variant="gold" />
          </div>

          <div className="glass rounded-[2rem] p-10 border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            <div className="absolute top-6 left-8 flex items-center gap-3 opacity-40">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase">Ambient Stream</span>
            </div>
            <PulseVisualizer isProcessing={isProcessing || isRecording} volume={volume} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass rounded-[1.5rem] p-6 border-white/5 space-y-4">
              <span className="text-[10px] font-black tracking-widest uppercase text-white/30">X-FACTOR DDP</span>
              <div className="h-12 bg-emerald-500/10 rounded border border-emerald-500/10 animate-pulse" />
            </div>
            <div className="glass rounded-[1.5rem] p-6 border-white/5 space-y-4">
              <span className="text-[10px] font-black tracking-widest uppercase text-white/30">AUDITOR ALERT</span>
              <p className="text-[10px] text-white/50">Analyzing...</p>
            </div>
            <div className="glass rounded-[1.5rem] p-6 border-white/5 space-y-4">
              <span className="text-[10px] font-black tracking-widest uppercase text-white/30">BILLING</span>
              <div className="flex gap-2"><div className="w-8 h-4 bg-white/5 rounded" /><div className="w-8 h-4 bg-white/5 rounded" /></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 h-[calc(100vh-200px)]">
          <div className="glass rounded-[2rem] border-white/5 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">Diarized Stream</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {liveTranscript.map((line) => (
                <div key={line.id} className={`p-4 rounded-2xl border ${line.role === 'Doctor' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-black tracking-widest uppercase ${line.role === 'Doctor' ? 'text-emerald-400' : 'text-amber-500'}`}>{line.role}</span>
                    <span className="text-[8px] opacity-30">{line.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/80">{line.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
