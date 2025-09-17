"use client";

import React from "react";

type Props = {
  password: string;
  focused: boolean;
};

export default function PasswordRequirements({ password, focused }: Props) {
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`~]/.test(password);

  return (
    <div
      aria-live="polite"
      className={`absolute left-0 top-full mt-2 w-full p-3 rounded-md bg-gray-50 border text-sm text-gray-700 transition-opacity duration-150 ease-in-out z-10 ${
        focused ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{ borderColor: "#E6E8F0" }}
    >
      <div className="mb-1 font-medium text-xs text-slate-700">A senha deve conter:</div>
      <ul className="space-y-1 text-xs">
        <li className="flex items-center gap-2">
          <span className={hasNumber ? "text-green-500" : "text-gray-400"}>
            {hasNumber ? "✓" : "●"}
          </span>
          <span className={hasNumber ? "text-slate-700" : "text-gray-500"}>
            Pelo menos um número
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className={hasUpper ? "text-green-500" : "text-gray-400"}>
            {hasUpper ? "✓" : "●"}
          </span>
          <span className={hasUpper ? "text-slate-700" : "text-gray-500"}>
            Pelo menos uma letra maiúscula
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className={hasLower ? "text-green-500" : "text-gray-400"}>
            {hasLower ? "✓" : "●"}
          </span>
          <span className={hasLower ? "text-slate-700" : "text-gray-500"}>
            Pelo menos uma letra minúscula
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className={hasSpecial ? "text-green-500" : "text-gray-400"}>
            {hasSpecial ? "✓" : "●"}
          </span>
          <span className={hasSpecial ? "text-slate-700" : "text-gray-500"}>
            Pelo menos um caractere especial
          </span>
        </li>
      </ul>
    </div>
  );
}
