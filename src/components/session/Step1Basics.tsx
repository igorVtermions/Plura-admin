"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "@/components/ui/Image";
import { X, ChevronDown } from "lucide-react";

export type Tutor = { id: string | number; name: string };

type Props = {
  title: string;
  setTitle: (v: string) => void;
  startAt: Date | null;
  setStartAt: (d: Date | null) => void;
  endAt: Date | null;
  setEndAt: (d: Date | null) => void;
  tutors: Tutor[];
  selectedTutor: Tutor | null;
  setSelectedTutor: (t: Tutor | null) => void;
};

export default function Step1Basics(props: Props, ref: React.ForwardedRef<HTMLDivElement>) {
  const { title, setTitle, startAt, setStartAt, endAt, setEndAt, tutors, selectedTutor, setSelectedTutor } = props;

  const [tutorQuery, setTutorQuery] = React.useState("");
  const [showTutorList, setShowTutorList] = React.useState(false);
  const tutorBoxRef = React.useRef<HTMLDivElement | null>(null);
  const startHiddenRef = React.useRef<HTMLInputElement | null>(null);
  const endHiddenRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!tutorBoxRef.current) return;
      if (e.target instanceof Node && !tutorBoxRef.current.contains(e.target)) setShowTutorList(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowTutorList(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filteredTutors = React.useMemo(() => {
    const q = tutorQuery.trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter((t) => t.name.toLowerCase().includes(q));
  }, [tutorQuery, tutors]);

  function formatDate(d: Date | null) {
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <div className="w-full" ref={ref}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="session-title">Título da sala</Label>
          <Input id="session-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Insira o Título da sala" className="focus:outline-none focus:ring-0 focus:border-[#977CEC]" />
        </div>

        <div className="grid grid-cols-1 gap-4 px-1">
          <div className="relative">
            <Label>Data e hora de início</Label>
            <div className="relative" onClick={() => { try { startHiddenRef.current?.showPicker?.(); } catch {} startHiddenRef.current?.click(); startHiddenRef.current?.focus(); }}>
              <Input readOnly value={formatDate(startAt)} placeholder="dd/mm/aaaa às hh:mm" className="pr-10 cursor-pointer focus:outline-none focus:ring-0 focus:border-[#977CEC] focus:shadow-[inset_0_0_0_2px_rgba(151,124,236,0.18)]" />
              <ChevronDown className="h-4 w-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input ref={startHiddenRef} type="datetime-local" onChange={(e) => setStartAt(e.target.value ? new Date(e.target.value) : null)} className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden />
            </div>
          </div>

          <div className="relative">
            <Label>Data e hora de término</Label>
            <div className="relative" onClick={() => { try { endHiddenRef.current?.showPicker?.(); } catch {} endHiddenRef.current?.click(); endHiddenRef.current?.focus(); }}>
              <Input readOnly value={formatDate(endAt)} placeholder="dd/mm/aaaa às hh:mm" className="pr-10 cursor-pointer focus:outline-none focus:ring-0 focus:border-[#977CEC] focus:shadow-[inset_0_0_0_2px_rgba(151,124,236,0.18)]" />
              <ChevronDown className="h-4 w-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input ref={endHiddenRef} type="datetime-local" onChange={(e) => setEndAt(e.target.value ? new Date(e.target.value) : null)} className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden />
            </div>
          </div>
        </div>

        <div className="relative px-1" ref={tutorBoxRef}>
          <Label>Atribuir um instrutor</Label>
          <div className="relative">
            <Input
              value={selectedTutor ? selectedTutor.name : tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              onFocus={() => setShowTutorList(true)}
              onClick={() => setShowTutorList(true)}
              placeholder="Selecione os instrutores"
              readOnly={!!selectedTutor}
              disabled={!!selectedTutor}
              className={`${selectedTutor ? "bg-gray-100 text-gray-700" : ""} focus:outline-none focus:ring-0 focus:border-[#977CEC] focus:shadow-[inset_0_0_0_2px_rgba(151,124,236,0.18)]`}
            />

            {showTutorList && !selectedTutor && (
              <div className="mt-2 w-full rounded-md bg-white border shadow-sm" role="listbox">
                {filteredTutors.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-500">Nenhum instrutor encontrado</div>
                )}
                {filteredTutors.map((t) => (
                  <button
                    key={String(t.id)}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSelectedTutor(t);
                      setShowTutorList(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    role="option"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTutor && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5" style={{ background: "#F3F0FF", borderRadius: 32, border: "1px solid #D4C7FF" }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#977CEC" }}>
                <Image src="/UserCircle.svg" alt="Tutor" width={16} height={16} />
              </div>
              <span className="text-[14px] font-normal" style={{ color: "#191F33" }}>{selectedTutor.name}</span>
              <button type="button" onClick={() => { setSelectedTutor(null); setTutorQuery(""); }} className="ml-1 text-slate-600 hover:text-slate-800" aria-label="Remover instrutor">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ForwardedStep1Basics = React.forwardRef<HTMLDivElement, Props>(Step1Basics);



