"use client";

import React, { useRef, useState, useLayoutEffect } from "react";
import Modal from "@/components/ui/Modal";
import { ProgressBar } from "./progress-bar";
import toast from "react-hot-toast";
import { InstructorForm } from "./instructor-form";
import { Summary } from "./summary";
import { invokeFunction } from "@/services/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue?: (payload: Record<string, unknown> | null) => void;
  currentStep?: number;
  totalSteps?: number;
};

export function CreateInstructorModal({ open, onClose, onContinue, currentStep = 1 }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [about, setAbout] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tutorId, setTutorId] = useState<string | number | null>(null);
  const [pwFocused, setPwFocused] = useState(false);
  const [step, setStep] = useState<number>(currentStep ?? 1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = useState<number | "auto">("auto");

  React.useEffect(() => {
    setStep(currentStep ?? 1);
  }, [currentStep, open]);

  function measureAndSetHeight() {
    const ref = step === 1 ? step1Ref.current : step2Ref.current;
    if (!ref) {
      setPanelHeight("auto");
      return;
    }
    const rect = ref.getBoundingClientRect();
    const h = Math.ceil(rect.height) || ref.offsetHeight || ref.scrollHeight || 0;
    setPanelHeight(h);
  }

  useLayoutEffect(() => {
    measureAndSetHeight();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measureAndSetHeight());
      if (step1Ref.current) ro.observe(step1Ref.current);
      if (step2Ref.current) ro.observe(step2Ref.current);
    }
    return () => {
      if (ro) {
        try {
          ro.disconnect();
        } catch {}
      }
    };
  }, [step, name, email, phone, password, role, about, file, open]);

  if (!open) return null;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setRole("");
    setAbout("");
    setFile(null);
    setStep(1);
  }

  function resolveErrorMessage(err: unknown, fallback: string) {
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      if ("message" in err && typeof (err as { message?: string }).message === "string") {
        return (err as { message?: string }).message as string;
      }
      const maybeContext = (err as { context?: unknown }).context;
      if (maybeContext && typeof maybeContext === "object" && "response" in maybeContext) {
        const response = (maybeContext as { response?: unknown }).response;
        if (response && typeof response === "object") {
          const data = (response as { error?: string; message?: string }).error
            ? (response as { error?: string }).error
            : (response as { message?: string }).message;
          if (typeof data === "string") return data;
        }
      }
    }
    return fallback;
  }

  function handleCancel() {
    resetForm();
    onClose();
  }

  function formatPhoneFromDigits(d: string) {
    const digits = d.slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    const digits = val.replace(/\D/g, "").slice(0, 11);
    setPhone(formatPhoneFromDigits(digits));
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab"];
    if (allowedKeys.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  }

  async function handleContinueStep() {
    const missing: string[] = [];
    if (!name.trim()) missing.push("Nome");
    if (!email.trim()) missing.push("E-mail");
    if (!phone.trim()) missing.push("Telefone");
    if (!role.trim()) missing.push("Cargo / Função");
    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}`);
      return;
    }
    setStep(2);
  }

  async function handleCreateInstructor() {
    setLoading(true);
    try {
      if (tutorId) {
        const body = { password: password || undefined, topics: [], about: about.trim() };
        const updated = await invokeFunction<Record<string, unknown>>("tutor", {
          method: "PUT",
          body: { tutorId, ...body },
        });
        if (file) {
          const fd = new FormData();
          fd.append("photo", file);
          fd.append("tutorId", String(tutorId));
          try {
            await invokeFunction("tutor-photo", {
              method: "POST",
              body: fd,
            });
          } catch (err: unknown) {
            console.error("upload tutor photo error", err);
            toast.error("Instrutor atualizado, mas falha ao enviar foto.");
          }
        }
        const data = updated ?? { id: tutorId };
        toast.success("Instrutor atualizado com sucesso.");
        try {
          window.dispatchEvent(new CustomEvent("tutor:created", { detail: data }));
        } catch {}
        onContinue?.(data as Record<string, unknown>);
        resetForm();
        onClose();
        return;
      }

      const phoneDigits = phone.replace(/\D/g, "");
      const phoneForApi = phoneDigits
        ? phoneDigits.startsWith("55")
          ? `+${phoneDigits}`
          : `+55${phoneDigits}`
        : "";

      const body = {
        name: name.trim(),
        email: email.trim(),
        phone: phoneForApi,
        role: role.trim(),
        about: about.trim(),
        password: password || undefined,
        topics: [],
      };

      try {
        const created = await invokeFunction<Record<string, unknown>>("tutor", {
          method: "POST",
          body,
        });
        const createdId = created?.id ?? created?.tutorId ?? created?._id ?? null;
        if (file && createdId) {
          const fd = new FormData();
          fd.append("photo", file);
          fd.append("tutorId", String(createdId));
          try {
            await invokeFunction("tutor-photo", { method: "POST", body: fd });
          } catch (err: unknown) {
            console.error("upload tutor photo error", err);
            toast.error("Instrutor criado, mas falha ao enviar foto.");
          }
        }
        toast.success("Instrutor criado com sucesso.");
        try {
          window.dispatchEvent(new CustomEvent("tutor:created", { detail: created }));
        } catch {}
        onContinue?.((created ?? body) as Record<string, unknown>);
        resetForm();
        onClose();
      } catch (err: unknown) {
        const message = resolveErrorMessage(err, "Erro ao criar instrutor");
        toast.error(message);
      }
    } catch (err) {
      const message = resolveErrorMessage(err, "Erro inesperado ao criar/atualizar instrutor.");
      toast.error(message);
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
        onClick={handleContinueStep}
        className="w-full px-4 py-2 rounded-md text-white transition-transform duration-150 ease-in-out hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
        style={{ background: "#977CEC" }}
      >
        Continuar
      </button>
    </div>
  );

  const footerStep2 = (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full px-4 py-2 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100"
      >
        Voltar
      </button>
      <button
        type="button"
        onClick={handleCreateInstructor}
        disabled={loading}
        className="w-full px-4 py-2 rounded-md text-white transition-transform duration-150 ease-in-out hover:scale-105 hover:shadow-md disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
        style={{ background: "#977CEC" }}
      >
        {loading ? "Criando..." : "Criar instrutor"}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Cadastrar instrutor"
      subtitle={
        step === 1
          ? "Adicione as informações desse instrutor"
          : "Confirme as suas escolhas anteriores"
      }
      top={<ProgressBar total={2} current={step} />}
      footer={step === 1 ? footerStep1 : footerStep2}
      maxWidth="max-w-[520px]"
    >
      <div className="flex flex-col items-center">
        <div
          ref={wrapperRef}
          className="w-full overflow-hidden transition-height"
          style={{
            height: panelHeight === "auto" ? "auto" : `${panelHeight}px`,
            transition: "height 260ms ease",
          }}
        >
          <div
            className="flex w-[200%] transition-transform duration-300 ease-in-out"
            style={{ transform: step === 1 ? "translateX(0%)" : "translateX(-50%)" }}
          >
            <div className="w-full" ref={step1Ref}>
              <InstructorForm
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                handlePhoneChange={handlePhoneChange}
                handlePhoneKeyDown={handlePhoneKeyDown}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                role={role}
                setRole={setRole}
                about={about}
                setAbout={setAbout}
                file={file}
                setFile={setFile}
                pwFocused={pwFocused}
                setPwFocused={setPwFocused}
              />
            </div>
            <div className="w-full" ref={step2Ref}>
              <Summary name={name} role={role} email={email} phone={phone} about={about} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
