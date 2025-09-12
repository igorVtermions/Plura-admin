"use client";

import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  registered: "Conta criada com sucesso. Faça login para continuar.",
  password_changed: "Senha alterada com sucesso. Faça login para continuar.",
};

export function SuccessBanner() {
  const params = useSearchParams();
  const key = params.get("success") || "";
  const text = messages[key];
  if (!text) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 py-3">
      <div className="max-w-lg w-full rounded-md bg-green-100 text-green-800 border border-green-300 px-4 py-2 text-sm shadow-sm">
        {text}
      </div>
    </div>
  );
}

