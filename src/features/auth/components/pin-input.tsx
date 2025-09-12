"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PinInput({ value, onChange }: Props) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  function handleChange(index: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).padEnd(4, "");
    onChange(next);
    if (digit && index < 3) refs[index + 1].current?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Input
          key={i}
          ref={refs[i]}
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 text-center"
          aria-label={`Dígito ${i + 1}`}
        />
      ))}
    </div>
  );
}

