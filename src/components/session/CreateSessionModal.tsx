"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/instructor/ProgressBar";
import { ForwardedStep1Basics } from "./Step1Basics";
import { ForwardedStep2Topics } from "./Step2Topics";
import { ForwardedStep3Summary } from "./Step3Summary";
import api from "@/services/api";
import toast from "react-hot-toast";

type Tutor = { id: string | number; name: string };
const topicsMap = {
  depressao: "Depressão",
  alcoolismo: "Alcoolismo",
  autismo: "Autismo",
  drogas: "Drogas",
  ansiedade: "Ansiedade",
  estresse: "Estresse",
  desanimo: "Desânimo",
  outros: "Outros",
} as const;
type ReceivedTutor = {
  id?: string | number;
  _id?: string | number;
  tutorId?: string | number;
  uuid?: string | number;
  name?: string;
  fullName?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue?: (payload: Record<string, unknown> | null) => void;
  tutorOptions?: Tutor[];
};

export default function CreateSessionModal({ open, onClose, onContinue, tutorOptions }: Props) {
  const [step, setStep] = React.useState(1);
  const [allowOverflow, setAllowOverflow] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [startAt, setStartAt] = React.useState<Date | null>(null);
  const [endAt, setEndAt] = React.useState<Date | null>(null);

  const [tutors, setTutors] = React.useState<Tutor[]>(() => tutorOptions ?? []);
  const [selectedTutor, setSelectedTutor] = React.useState<Tutor | null>(null);

  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
  const [topicsAvailable, setTopicsAvailable] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const step1Ref = React.useRef<HTMLDivElement | null>(null);
  const step2Ref = React.useRef<HTMLDivElement | null>(null);
  const step3Ref = React.useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = React.useState<number | "auto">("auto");

  React.useEffect(() => {
    if (tutorOptions) {
      setTutors(tutorOptions);
      return;
    }
    if (!open) return;
    (async () => {
      try {
        const res = await api.get("/tutors");
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const mapped: Tutor[] = (data as ReceivedTutor[])
          .map((t) => ({
            id: t.id ?? t._id ?? t.tutorId ?? t.uuid ?? String(t.name ?? t.fullName ?? "unknown"),
            name: t.name ?? t.fullName ?? "Sem nome",
          }))
          .filter((t: Tutor) => !!t.name);
        setTutors(mapped);
      } catch {
        setTutors([]);
      }
    })();
  }, [tutorOptions, open]);

  function measureAndSetHeight() {
    const ref = step === 1 ? step1Ref.current : step === 2 ? step2Ref.current : step3Ref.current;
    if (!ref) {
      setPanelHeight("auto");
      return;
    }
    const rect = ref.getBoundingClientRect();
    const h = Math.ceil(rect.height) || ref.offsetHeight || ref.scrollHeight || 0;
    setPanelHeight(h);
  }

  React.useLayoutEffect(() => {
    measureAndSetHeight();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureAndSetHeight());
      if (step1Ref.current) ro.observe(step1Ref.current);
      if (step2Ref.current) ro.observe(step2Ref.current);
      if (step3Ref.current) ro.observe(step3Ref.current);
    }
    return () => {
      if (ro) {
        try {
          ro.disconnect();
        } catch {}
      }
    };
  }, [step, title, startAt, endAt, selectedTutor, open]);
  React.useEffect(() => {
    if (!open || step !== 2) return;
    (async () => {
      try {
        const res = await api.get("/tutors/topics/available");
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const list = (data as unknown[])
          .map((v) => (typeof v === "string" ? v : null))
          .filter((v): v is string => !!v);
        setTopicsAvailable(list);
      } catch {
        setTopicsAvailable(Object.keys(topicsMap));
      }
    })();
  }, [open, step]);
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    function onFocusIn() {
      setAllowOverflow(true);
    }
    function onFocusOut(e: FocusEvent) {
      const related = (e as FocusEvent).relatedTarget as Node | null;
      if (related && wrapperRef.current?.contains(related)) return;
      setAllowOverflow(false);
    }
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  function clearAll() {
    setTitle("");
    setStartAt(null);
    setEndAt(null);
    setSelectedTutor(null);
    setStep(1);
  }

  function handleCancel() {
    clearAll();
    onClose();
  }

  async function handleContinue() {
    if (step === 1) {
      const missing: string[] = [];
      if (!title.trim()) missing.push("Título da sala");
      if (!startAt) missing.push("Data e hora de início");
      if (!endAt) missing.push("Data e hora de término");
      if (!selectedTutor) missing.push("Instrutor");
      if (missing.length) {
        toast.error(`Preencha: ${missing.join(", ")}`);
        return;
      }
      const now = new Date();
      if (startAt && startAt <= now) {
        toast.error("A data/hora de início deve estar no futuro.");
        return;
      }
      if (endAt && endAt <= now) {
        toast.error("A data/hora de término deve estar no futuro.");
        return;
      }
      if (startAt && endAt && startAt >= endAt) {
        toast.error("O início deve ser antes do término.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedTopics.length) {
        toast.error("Escolha ao menos um tópico.");
        return;
      }
      setStep(3);
      return;
    }
    try {
      setLoading(true);
      const body = {
        tutorId: selectedTutor?.id,
        title: title.trim(),
        startAt: startAt?.toISOString(),
        endAt: endAt?.toISOString(),
        topic: selectedTopics,
      } as const;
      const res = await api.post("/admin/live-chat-rooms", body);
      if (res.status >= 200 && res.status < 300) {
        toast.success("Sessão criada com sucesso.");
        try {
          window.dispatchEvent(new CustomEvent("session:created", { detail: res.data }));
        } catch {}
        onContinue?.(res.data ?? body);
        clearAll();
        onClose();
      } else {
        const payload = res.data ?? null;
        const message = (payload && (payload.message || payload.error)) || "Erro ao criar sessão";
        toast.error(String(message));
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string };
      const status = e.response?.status;
      const data = e.response?.data;
      let message: string | undefined;

      if (data && typeof data === "object") {
        const payload = data as Record<string, unknown>;
        const maybe = payload.message ?? payload.error;
        if (typeof maybe === "string") message = maybe;
      }

      if (!message) {
        message =
          status === 409
            ? "Conflito de horário para este instrutor."
            : (e.message ?? "Erro ao criar sessão");
      }

      toast.error(String(message));
    } finally {
      setLoading(false);
    }
  }

  const footerStep1 = (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={handleCancel}
        className="w-full px-4 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleContinue}
        className="w-full px-4 py-2 rounded-md text-white transition-transform duration-150 ease-in-out hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
        style={{ background: "#977CEC" }}
      >
        Continuar
      </button>
    </div>
  );

  const footerStepNext = (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setStep((s) => Math.max(1, s - 1))}
        className="w-full px-4 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100"
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={handleContinue}
        disabled={loading}
        className="w-full px-4 py-2 rounded-md text-white transition-transform duration-150 ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
        style={{ background: "#977CEC" }}
      >
        {step === 3 ? (loading ? "Criando..." : "Criar sessão") : "Continuar"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Criar sessão"
      subtitle={
        step === 2
          ? "Atribua os tópicos que serão assunto dessa sessão"
          : step === 3
            ? "Confirme as suas escolhas anteriores"
            : "Configure as informações da sala"
      }
      top={<ProgressBar total={3} current={step} />}
      footer={step === 1 ? footerStep1 : footerStepNext}
      maxWidth="max-w-[520px]"
    >
      <div className="flex flex-col items-center">
        <div
          ref={wrapperRef}
          className="w-full transition-height"
          style={{
            height: panelHeight === "auto" ? "auto" : `${panelHeight}px`,
            transition: "height 260ms ease",
            overflow: allowOverflow ? "visible" : "hidden",
          }}
        >
          <div
            className="flex w-[300%] transition-transform duration-300 ease-in-out"
            style={{
              transform:
                step === 1
                  ? "translateX(0%)"
                  : step === 2
                    ? "translateX(-33.3333%)"
                    : "translateX(-66.6667%)",
            }}
          >
            <div className="w-full" ref={step1Ref}>
              <ForwardedStep1Basics
                title={title}
                setTitle={setTitle}
                startAt={startAt}
                setStartAt={setStartAt}
                endAt={endAt}
                setEndAt={setEndAt}
                tutors={tutors}
                selectedTutor={selectedTutor}
                setSelectedTutor={setSelectedTutor}
              />
            </div>

            <div className="w-full" ref={step2Ref}>
              <ForwardedStep2Topics
                topics={
                  topicsAvailable.length ? topicsAvailable : (Object.keys(topicsMap) as string[])
                }
                labelMap={topicsMap as Record<string, string>}
                selected={selectedTopics}
                setSelected={setSelectedTopics}
              />
            </div>
            <div className="w-full" ref={step3Ref}>
              <ForwardedStep3Summary
                title={title}
                startAt={startAt}
                endAt={endAt}
                tutor={selectedTutor}
                topics={selectedTopics}
                labelMap={topicsMap as Record<string, string>}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
