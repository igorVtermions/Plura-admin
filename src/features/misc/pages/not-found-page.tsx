"use client";

import React from "react";
import Image from "@/components/ui/Image";
import Link from "@/components/router/Link";

export default function NotFoundPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ background: "#F7F9FF", border: "1px solid #D0D9F1" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-8 flex flex-col items-start justify-center gap-4">
            <div className="text-[52px] font-bold leading-none" style={{ color: "#6B4DB8" }}>404</div>
            <h1 className="text-[24px] font-medium" style={{ color: "#191F33" }}>Página não encontrada</h1>
            <p className="text-sm" style={{ color: "#5A6480" }}>
              A página que você procura não existe ou foi movida. Verifique o endereço ou volte para a página inicial.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white"
                style={{ background: "#977CEC" }}
              >
                <Image src="/Home.svg" alt="Início" width={16} height={16} />
                Ir para Início
              </Link>
              <button
                type="button"
                onClick={() => history.back()}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 cursor-pointer"
                style={{ background: "#FFFFFF", border: "1px solid #D0D9F1", color: "#191F33" }}
              >
                <Image src="/Arrow.svg" alt="Voltar" width={12} height={12} />
                Voltar
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center p-8">
            <div
              aria-hidden
              style={{
                width: 220,
                height: 220,
                WebkitMask: "url(/Support.svg) center / contain no-repeat",
                mask: "url(/Support.svg) center / contain no-repeat",
                background: "#6C7A99",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

