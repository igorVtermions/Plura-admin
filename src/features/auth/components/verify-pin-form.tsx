"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import axios from "axios";

type Props = { email: string; adminId?: string };

export function VerifyPinForm({ email, adminId }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [success]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    const pin = digits.join("");
    if (pin.length !== 4) {
      setError("Informe o PIN de 4 dígitos");
      return;
    }

    const payload: { pin: string; adminId?: number; email?: string } = { pin };
    if (adminId) {
      const idNum = Number(adminId);
      if (Number.isNaN(idNum)) {
        setError("adminId inválido");
        return;
      }
      payload.adminId = idNum;
    } else {
      payload.email = email;
    }

    try {
      setLoading(true);
      await api.post("/admin/pin/verify", payload);
      router.push("/home");
    } catch (err: unknown) {
      let message = "Erro ao verificar PIN";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        message = data?.message ?? data?.error ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function resendPin() {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const res = await api.post("/admin/pin/resend", { email });
      const msg = res.data?.message ?? "PIN reenviado. Verifique seu e-mail.";
      setSuccess(msg);
    } catch (err: unknown) {
      let message = "Erro ao reenviar PIN";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        message = data?.message ?? data?.error ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-6 max-w-md w-full" onSubmit={(e) => onSubmit(e)}>
      <div className="text-left">
        <Label>Email</Label>
        <div className="text-sm text-muted-foreground">{email}</div>
      </div>

      <div className="flex flex-col items-center">
        <Label className="mb-2">Informe o código (4 dígitos)</Label>
        <div className="flex gap-3 mt-2 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <Input
              key={i}
              ref={(el: HTMLInputElement | null) => {
                inputs.current[i] = el;
              }}
              className="w-16 h-16 text-center text-2xl p-0 rounded-md"
              maxLength={1}
              value={digits[i]}
              onChange={(ev) => handleChange(i, ev.currentTarget.value)}
              onKeyDown={(ev) => handleKey(ev, i)}
              inputMode="numeric"
              pattern="\d*"
              aria-label={`Dígito ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 text-center" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 text-center" role="status" aria-live="polite">
          {success}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button
          type="submit"
          disabled={loading}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          {loading ? "Verificando..." : "Verificar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resendPin}
          disabled={loading}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          Reenviar PIN
        </Button>
      </div>
    </form>
  );
}

export default VerifyPinForm;