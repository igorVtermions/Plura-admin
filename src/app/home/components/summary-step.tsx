"use client";

import React from "react";
import type { Tutor } from "./first-steps";

type Props = {
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  tutor: Tutor | null;
  topics: string[];
  labelMap?: Record<string, string>;
};

function formatDate(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function SummaryStep(
  { title, startAt, endAt, tutor, topics, labelMap = {} }: Props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <div className="w-full" ref={ref}>
      <div className="w-full mt-2">
        <div
          className="w-full p-4 rounded-md"
          style={{ background: "#F3F0FF", border: "1px solid #D4C7FF" }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Título da sala</div>
              <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{title || "—"}</div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>
                Data e hora de início
              </div>
              <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>
                {formatDate(startAt) || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>
                Data e hora de término
              </div>
              <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>
                {formatDate(endAt) || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Instrutor</div>
              <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>
                {tutor?.name || "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Tópicos</div>
              <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>
                {topics.length ? topics.map((k) => labelMap[k] || k).join(", ") : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ForwardedStep3Summary = React.forwardRef<HTMLDivElement, Props>(SummaryStep);
