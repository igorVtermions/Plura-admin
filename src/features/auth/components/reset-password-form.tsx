"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/lib/router";
import { invokeFunction } from "@/services/api";
import { Eye, EyeClosed } from "lucide-react";

type Props = { email?: string; adminId?: string };

type ApiErrorResponse = { message?: string; error?: string } & Record<string, unknown>;

type VerifyRequest = { pin: string; email?: string; adminId?: number };
type ResetRequest = { pin: string; password: string; confirmPassword: string; email?: string; adminId?: number };
type ForgotRequest = { email?: string; adminId?: number };

export default function ResetPasswordForm({ email, adminId }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleChange(i: number, v: string) {
    if (!/^\d?$/.test(v)) return;
    const n = [...digits];
    n[i] = v;
    setDigits(n);
    if (v && i < 3) inputs.current[i + 1]?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  async function verifyPin(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    const pin = digits.join("");
    if (pin.length !== 4) {
      setError("Informe o código de 4 dígitos.");
      return;
    }
    if (!email && !adminId) {
      setError("E‑mail ou adminId não informado.");
      return;
    }

    const payload: VerifyRequest = { pin };
    if (adminId) {
      const idNum = Number(adminId);
      if (Number.isNaN(idNum)) {
        setError("adminId inválido.");
        return;
      }
      payload.adminId = idNum;
    } else {
      payload.email = email;
    }

    try {
      setLoadingVerify(true);
      await invokeFunction("users-verify-reset-pin", { method: 'POST', body: payload });
      setVerified(true);
      setSuccess("Código verificado. Você pode escolher a nova senha.");
    } catch (err: unknown) {
      let message = "Erro ao verificar código.";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoadingVerify(false);
    }
  }

  async function onSubmitReset(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!verified) {
      setError("Verifique o código antes de redefinir a senha.");
      return;
    }
    if (!password) {
      setError("Informe a nova senha.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    const pin = digits.join("");
    const payload: ResetRequest = {
      pin,
      password,
      confirmPassword: confirm,
    };
    if (adminId) {
      const idNum = Number(adminId);
      if (Number.isNaN(idNum)) {
        setError("adminId inválido.");
        return;
      }
      payload.adminId = idNum;
    } else {
      payload.email = email;
    }

    try {
      setLoadingReset(true);
      await invokeFunction("users-reset-password", { method: 'POST', body: payload });
      setSuccess("Senha alterada com sucesso. Redirecionando...");
      setTimeout(() => router.push("/"), 900);
    } catch (err: unknown) {
      let message = "Erro ao alterar senha.";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoadingReset(false);
    }
  }

  async function resendPin() {
    setError(null);
    setSuccess(null);
    if (!email && !adminId) {
      setError("E‑mail ou adminId não informado.");
      return;
    }

    const payload: ForgotRequest = {};
    if (adminId) {
      const idNum = Number(adminId);
      if (Number.isNaN(idNum)) {
        setError("adminId inválido.");
        return;
      }
      payload.adminId = idNum;
    } else {
      payload.email = email;
    }

    try {
      setLoadingVerify(true);
      await invokeFunction("users-forgot-password", { method: 'POST', body: payload });
      setSuccess("Código reenviado. Verifique seu e‑mail.");
    } catch (err: unknown) {
      let message = "Erro ao reenviar código.";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoadingVerify(false);
    }
  }

  function passwordRules(pw: string) {
    return {
      minLength: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[!@#$%^&*()\-_=+\[\]{};:'",.<>\/?\\|`~]/.test(pw),
    };
  }

  const rules = passwordRules(password);

  return (
    <form
      className="max-w-md w-full mx-auto grid gap-4"
      onSubmit={(e) => (verified ? onSubmitReset(e) : verifyPin(e))}
      noValidate
    >
      <div className="text-left">
        <Label>Email</Label>
        <div className="text-sm text-muted-foreground">{email ?? adminId ?? "—"}</div>
      </div>

      {!verified ? (
        <>
          <div className="flex flex-col items-center">
            <Label className="mb-2">Código (4 dígitos)</Label>
            <div className="flex gap-3 mt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Input
                  key={i}
                  ref={(el: HTMLInputElement | null) => {
                    inputs.current[i] = el;
                  }}
                  className="w-14 h-14 text-center text-2xl p-0 rounded-md"
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

          <div className="flex gap-3 justify-center">
            <Button type="button" className="cursor-pointer" onClick={verifyPin} disabled={loadingVerify}>
              {loadingVerify ? "Verificando..." : "Verificar código"}
            </Button>
            <Button type="button" variant="outline" onClick={resendPin} disabled={loadingVerify} className="cursor-pointer">
              Reenviar código
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm text-green-600">Código verificado.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha"
                required
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {showPassword ? <EyeClosed className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Use pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.
            </div>

            <ul className="mt-2 grid gap-1">
              <li className={rules.minLength ? "text-green-600 text-sm" : "text-gray-500 text-sm"}>
                {rules.minLength ? "✓" : "•"} Mínimo 8 caracteres
              </li>
              <li className={rules.uppercase ? "text-green-600 text-sm" : "text-gray-500 text-sm"}>
                {rules.uppercase ? "✓" : "•"} Uma letra maiúscula
              </li>
              <li className={rules.lowercase ? "text-green-600 text-sm" : "text-gray-500 text-sm"}>
                {rules.lowercase ? "✓" : "•"} Uma letra minúscula
              </li>
              <li className={rules.number ? "text-green-600 text-sm" : "text-gray-500 text-sm"}>
                {rules.number ? "✓" : "•"} Um número
              </li>
              <li className={rules.special ? "text-green-600 text-sm" : "text-gray-500 text-sm"}>
                {rules.special ? "✓" : "•"} Um caractere especial
              </li>
            </ul>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar nova senha"
                required
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {showConfirm ? <EyeClosed className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button type="submit" className="cursor-pointer" disabled={loadingReset}>
              {loadingReset ? "Salvando..." : "Salvar nova senha"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setVerified(false)} disabled={loadingReset} className="cursor-pointer">
              Alterar código
            </Button>
          </div>
        </>
      )}

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
    </form>
  );
}
