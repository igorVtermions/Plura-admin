"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/features/auth/components/pin-input";
import { useRouter } from "next/navigation";
import Link from "next/link";

function validatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("".padEnd(4, ""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwFocused, setPwFocused] = useState(false);

  const rules = useMemo(() => validatePassword(password), [password]);
  const allOk = Object.values(rules).every(Boolean);
  const match = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && confirm !== password;

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    // Simula envio de email e vai para PIN
    setStep(2);
  }

  function submitPin(e: React.FormEvent) {
    e.preventDefault();
    if (/^\d{4}$/.test(pin)) setStep(3);
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!allOk || !match) return;
    router.push("/?success=password_changed");
  }

  return (
    <main className="min-h-dvh w-full bg-white flex flex-col items-center justify-center px-6 py-10 gap-8">
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Esqueci minha senha</CardTitle>
          <CardDescription>Recupere o acesso à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form className="grid gap-4" onSubmit={submitEmail}>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="E-mail" autoComplete="email" required value={email} onChange={(e)=>setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Enviar código</Button>
            </form>
          )}

          {step === 2 && (
            <form className="grid gap-4" onSubmit={submitPin}>
              <div className="grid gap-2">
                <Label>Digite o PIN de 4 dígitos enviado ao e-mail</Label>
                <PinInput value={pin} onChange={setPin} />
              </div>
              <Button type="submit" className="w-full">Validar PIN</Button>
            </form>
          )}

          {step === 3 && (
            <form className="grid gap-4" onSubmit={submitReset}>
              <div className="grid gap-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  aria-describedby="password-help"
                />
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
                <Label htmlFor="confirm_password">Confirmar nova senha</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Confirmar nova senha"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-describedby="confirm-help"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p id="confirm-help" className="text-xs text-red-600">As senhas não coincidem</p>
                )}
                {confirm.length > 0 && confirm === password && (
                  <p id="confirm-help" className="text-xs text-green-600">As senhas coincidem</p>
                )}
              </div>
              <Button type="submit" className="w-full">Alterar senha</Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">← Voltar para login</Link>
          <div />
        </CardFooter>
      </Card>
    </main>
  );
}
