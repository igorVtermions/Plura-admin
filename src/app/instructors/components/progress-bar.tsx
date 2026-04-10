"use client";

import React from "react";

type Props = {
  total: number;
  current: number;
};

export function ProgressBar({ total, current }: Props) {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-3">
      <div className="flex gap-2 items-center">
        {Array.from({ length: total }).map((_, i) => {
          const active = i + 1 <= current;
          return (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                active ? "bg-[#977CEC]" : "bg-[#EAEAF7]"
              }`}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}
