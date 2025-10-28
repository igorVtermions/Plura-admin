import React, { useEffect, useState } from "react";
import { VerifyPinForm } from "@/features/auth/components/verify-pin-form";

export const metadata = { title: "Verificar conta | Plura Talks - Administrador" };

export default function Page({ searchParams }: { searchParams?: { email?: string; adminId?: string } }) {
  // Estado local para suportar tanto Next (searchParams) quanto SPA (window.location.search)
  const [clientEmail, setClientEmail] = useState<string | undefined>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") ?? undefined : searchParams?.email
  );
  const [clientAdminId, setClientAdminId] = useState<string | undefined>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("adminId") ?? undefined : searchParams?.adminId
  );

  // No client, atualiza caso a URL tenha sido alterada pelo router
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setClientEmail(sp.get("email") ?? searchParams?.email);
    setClientAdminId(sp.get("adminId") ?? searchParams?.adminId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Email não fornecido na query. Volte ao formulário de cadastro ou acesse /verify?email=seu@email.com
          </div>
        )}
      </div>
    </main>
  );
}