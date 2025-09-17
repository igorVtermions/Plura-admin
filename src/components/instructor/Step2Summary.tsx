"use client";

import React from "react";

type Props = {
  name: string;
  role: string;
  email: string;
  phone: string;
  about: string;
};

export default function Step2Summary({ name, role, email, phone, about }: Props) {
  return (
    <div className="w-full mt-2">
      <div className="w-full p-4 rounded-md" style={{ background: "#F3F0FF", border: "1px solid #D4C7FF" }}>
        <div className="flex flex-col gap-3">
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Nome do instrutor</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{name}</div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Cargo/Função</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{role}</div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>E-mail</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{email}</div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Telefone</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{phone}</div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#191F33" }}>Sobre</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: "#5A6480" }}>{about || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}