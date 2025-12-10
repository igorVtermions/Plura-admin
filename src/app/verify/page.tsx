import React, { useEffect, useState } from "react";
import { VerifyPinForm } from "@/app/auth/components/verify-pin-form";

export const metadata = { title: "Verificar conta | Plura Talks - Administrador" };

export function VerifyPage({
  searchParams,
}: {
  searchParams?: { email?: string; adminId?: string };
}) {
  const [clientEmail, setClientEmail] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("email") ?? undefined;
    }
    return searchParams?.email;
  });

  const [clientAdminId, setClientAdminId] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("adminId") ?? undefined;
    }
    return searchParams?.adminId;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setClientEmail(sp.get("email") ?? searchParams?.email);
    setClientAdminId(sp.get("adminId") ?? searchParams?.adminId);
  }, [searchParams?.email, searchParams?.adminId]);

  const email = clientEmail ?? "";
  const adminId = clientAdminId ?? undefined;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg bg-white/0 rounded-md p-6">
        <h1 className="text-2xl font-medium mb-4 text-left">Verificar conta</h1>
        <p className="text-sm text-muted-foreground mb-6 text-left">
          Enviamos um código de 4 dígitos para o seu e-mail. Informe-o abaixo para ativar sua conta.
        </p>

        {email ? (
          <div className="flex justify-center">
            <VerifyPinForm email={email} adminId={adminId} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-left">
            Email não fornecido na query. Volte ao formulário de cadastro ou acesse
            /verify?email=seu@email.com
          </div>
        )}
      </div>
    </main>
  );
}
