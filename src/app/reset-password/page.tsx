import React from "react";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";

export const metadata = { title: "Nova senha | Plura Talks - Administrador" };

export default function Page({ searchParams }: { searchParams?: { email?: string; adminId?: string } }) {
  const email = searchParams?.email ?? undefined;
  const adminId = searchParams?.adminId ?? undefined;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-lg p-6 rounded-md">
        <h1 className="text-2xl font-medium mb-4">Alterar senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Informe o código recebido e escolha sua nova senha.
        </p>
        <ResetPasswordForm email={email} adminId={adminId} />
      </div>
    </main>
  );
}