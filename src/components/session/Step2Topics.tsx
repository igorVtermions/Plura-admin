"use client";

import React from "react";

type Props = {
  topics: string[];
  labelMap?: Record<string, string>;
  selected: string[];
  setSelected: (v: string[]) => void;
};

export default function Step2Topics({ topics, labelMap = {}, selected, setSelected }: Props, ref: React.ForwardedRef<HTMLDivElement>) {
  function toggle(k: string) {
    setSelected(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  }

  return (
    <div className="w-full" ref={ref}>
      <div className="w-full mt-2">
        <div className="grid grid-cols-2 gap-3">
          {topics.map((key) => {
            const label = labelMap[key] || key;
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(key)}
                className="h-[52px] rounded-[32px] border px-4 flex items-center justify-center text-[14px] font-medium transition-transform duration-150 ease-in-out focus:outline-none hover:-translate-y-1 hover:shadow-sm"
                style={{
                  background: active ? "#F3F0FF" : "#FFFFFF",
                  borderColor: active ? "#D4C7FF" : "#E2E8F8",
                  color: active ? "#977CEC" : "#191F33",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const ForwardedStep2Topics = React.forwardRef<HTMLDivElement, Props>(Step2Topics);

