"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "@/components/router/Link";
import { useRouter } from "@/lib/router";
import { invokeFunction } from "@/services/api";
import axios from "axios";
import { Eye, EyeClosed } from "lucide-react";

function validatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function RegisterForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwFocused, setPwFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = useMemo(() => validatePassword(password), [password]);
  const allOk = Object.values(rules).every(Boolean);
  const match = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!allOk || !match) return;

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const pw = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");

    if (!name || !email || !pw || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      const res = await invokeFunction<{ id?: number; adminId?: number; admin?: { id: number } }>("register", {
        method: 'POST',
        body: {
          name,
          email,
          password: pw,
          confirmPassword,
        }
      });

      const rawId = res.id ?? res.adminId ?? res.admin?.id;
      const adminId = rawId != null ? Number(rawId) : undefined;

      try {
        if (!Number.isNaN(adminId)) {
          await invokeFunction("send-pin", { method: 'POST', body: { adminId, via: "email" } });
        } else {
          await invokeFunction("send-pin", { method: 'POST', body: { email, via: "email" } });
        }
      } catch {
      }

      const q = new URLSearchParams();
      q.set("email", email);
      if (!Number.isNaN(adminId)) q.set("adminId", String(adminId));
      router.push(`/verify?${q.toString()}`);
    } catch (err: unknown) {
      let message = "Erro ao criar conta";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" type="text" placeholder="Seu nome" autoComplete="name" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="E-mail" autoComplete="email" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            aria-describedby="password-help"
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
        {pwFocused && (
          <ul id="password-help" className="text-xs text-muted-foreground space-y-1">
            <li className={rules.length ? "text-green-600" : "text-red-600"}>• Mínimo 8 caracteres</li>
            <li className={rules.upper ? "text-green-600" : "text-red-600"}>• Pelo menos 1 letra maiúscula</li>
            <li className={rules.lower ? "text-green-600" : "text-red-600"}>• Pelo menos 1 letra minúscula</li>
            <li className={rules.number ? "text-green-600" : "text-red-600"}>• Pelo menos 1 número</li>
            <li className={rules.special ? "text-green-600" : "text-red-600"}>• Pelo menos 1 caractere especial</li>
          </ul>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="confirm_password">Confirmar senha</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-describedby="confirm-help"
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
        {mismatch && <p id="confirm-help" className="text-xs text-red-600">As senhas não coincidem</p>}
        {!mismatch && match && <p id="confirm-help" className="text-xs text-green-600">As senhas coincidem</p>}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar conta"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Já tem conta? <Link href="/" className="text-primary hover:underline">Entrar</Link>
      </p>
    </form>
  );
}

export default RegisterForm;
