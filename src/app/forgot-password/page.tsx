import React from "react";
import ForgotPasswordForm from "@/features/auth/components/forgot-password-form";

export const metadata = { title: "Recuperar senha | Plura Talks - Administrador" };

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg p-6 rounded-md">
        <h1 className="text-2xl font-medium mb-4">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Informe o e‑mail da conta. Enviaremos um código de verificação para prosseguir.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}

