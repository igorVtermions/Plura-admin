"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/lib/router";
import { invokeFunction } from "@/services/api";

type ApiErrorResponse = { message?: string; error?: string } & Record<string, unknown>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);
    const value = email.trim();
    if (!value) {
      setError("Informe um e‑mail válido.");
      return;
    }

    try {
      setLoading(true);
      await invokeFunction("users-forgot-password", { method: "POST", body: { email: value } });
      setSuccess("Código enviado. Verifique seu e‑mail.");
      const q = new URLSearchParams({ email: value });
      setTimeout(() => router.push(`/reset-password?${q.toString()}`), 900);
    } catch (err: unknown) {
      let message = "Erro ao enviar código.";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="max-w-md w-full mx-auto grid gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="fp-email">E-mail</Label>
        <Input
          id="fp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e‑mail"
          required
          autoComplete="email"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600" role="status" aria-live="polite">
          {success}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar código"}
      </Button>
    </form>
  );
}
