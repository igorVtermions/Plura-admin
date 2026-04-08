"use client";

import React, { useState } from "react";
import { Eye, EyeClosed, Loader2 } from "lucide-react";
import Link from "@/router/Link";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invokeFunction, setClientSession, setClientToken } from "@/services/api";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      try {
        setClientToken(null);
      } catch {}
      const res = await invokeFunction<{
        token?: string;
        accessToken?: string;
        refreshToken?: string;
        refresh_token?: string;
        message?: string;
      }>("admin-login", {
        method: "POST",
        body: { email, password },
      });

      const token = res?.token ?? res?.accessToken ?? null;
      const refreshToken = res?.refreshToken ?? res?.refresh_token ?? null;
      if (token) {
        await setClientSession({ accessToken: token, refreshToken });
        router.push("/home");
        return;
      }

      const message = res?.data?.message ?? "Autenticação realizada, mas sem token.";
      setError(message);
    } catch (err: unknown) {
      let message = "Erro ao autenticar.";
      if (err instanceof Error) {
        if (err.message.includes("credentials")) {
          message = "Credenciais inválidas.";
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="E-mail"
          autoComplete="email"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            autoComplete="current-password"
            required
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          >
            {showPassword ? (
              <EyeClosed className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline justify-self-start"
        >
          Esqueci minha senha
        </Link>
      </div>

      {error && (
        <div className="text-sm text-red-600" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span className="sr-only">Entrando...</span>
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
