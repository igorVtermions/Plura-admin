"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      className={cn(
        "relative flex rounded-full bg-[#EEF1FF] border border-[#E2E8F8] p-1 text-sm",
        className,
      )}
      role="tablist"
      aria-label="Controle de sessões"
    >
      <div
        className="absolute inset-y-1 rounded-full bg-white shadow-sm transition-transform"
        style={{ width: `calc(50% - 4px)`, transform: `translateX(calc(${index} * 100%))` }}
        aria-hidden
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={cn(
              "relative z-10 flex-1 px-4 py-2 rounded-full",
              active ? "text-[#6B4DB8]" : "text-[#6C7A99]",
            )}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

