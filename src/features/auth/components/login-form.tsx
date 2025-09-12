"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  return (
    <form className="grid gap-4" action="#" method="post">
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
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Senha" required />
        <Link href="/forgot-password" className="text-sm text-primary hover:underline justify-self-start">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  );
}
