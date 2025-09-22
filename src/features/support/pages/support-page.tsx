"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function SupportPage() {
  const denuncias = 0;
  const chamados = 0;
  const chats = Array.from({ length: 14 }).map((_, i) => ({
    id: String(i + 1),
    title: `Sala de suporte #${i + 1}`,
    userName: `Usuário ${i + 1}`,
    nickname: `codinome_${i + 1}`,
    photoUrl: "",
  }));
  const [page, setPage] = React.useState(1);
  const perPage = 9;
  const totalPages = Math.max(1, Math.ceil(chats.length / perPage));
  const paged = chats.slice((page - 1) * perPage, page * perPage);
  const pagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const selectedBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pageAnimating, setPageAnimating] = React.useState(false);
  function goPage(p: number) {
    const next = Math.max(1, Math.min(totalPages, p));
    setPage(next);
    setTimeout(() => {
      if (selectedBtnRef.current) {
        selectedBtnRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }, 50);
  }
  React.useEffect(() => {
    setPageAnimating(true);
    const t = setTimeout(() => setPageAnimating(false), 260);
    return () => clearTimeout(t);
  }, [page]);

  return (
    <div className="flex-1 flex bg-white min-h-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0">
          <div className="max-w-5xl mx-auto w-full min-h-0">
            <h1
              className="text-[32px] mb-6"
              style={{ fontFamily: "var(--font-rubik)" }}
            >
              Suporte
            </h1>

            <section className="p-1 rounded-lg">
              <h2 className="font-medium text-[20px] mb-4">Ações rápidas</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
                  style={{ border: "1px solid #D0D9F1" }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      WebkitMask: "url(/Megaphone.svg) center / contain no-repeat",
                      mask: "url(/Megaphone.svg) center / contain no-repeat",
                      background: "#808DB2",
                    }}
                  />
                  <span className="text-[16px] font-medium text-[#191F33]">Denúncia</span>
                  <span className="text-sm text-[#191F33]">
                    {denuncias > 0 ? `${denuncias} denúncia${denuncias > 1 ? "s" : ""}` : "Nenhuma denúncia"}
                  </span>
                </button>

                <button
                  type="button"
                  className="rounded-md flex flex-col justify-center items-start gap-3 p-5 w-full flex-1 min-w-0 bg-[#F7F9FF] cursor-pointer transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#977CEC]"
                  style={{ border: "1px solid #D0D9F1" }}
                >
                  <Image src="/Hand.svg" alt="Problemas Técnicos" width={32} height={32} />
                  <span className="text-[16px] font-medium text-[#191F33]">Problemas Técnicos</span>
                  <span className="text-sm text-[#191F33]">
                    {chamados > 0 ? `${chamados} chamado${chamados > 1 ? "s" : ""}` : "Nenhum chamado"}
                  </span>
                </button>
              </div>
            </section>

            <section className="p-1 rounded-lg mt-6 pb-0 md:pb-0">
              <h2 className="font-medium text-[20px] mb-4">Chat de Suporte</h2>
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${pageAnimating ? "page-transition" : ""}`}>
                {paged.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl flex transition-transform duration-150 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
                    style={{
                      height: 174,
                      padding: 16,
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 16,
                      background: "#F3F0FF",
                      border: "1px solid #D4C7FF",
                    }}
                  >
                    <header className="w-full flex items-start justify-between">
                      <h3 className="text-[16px] font-medium" style={{ color: "#361A6D" }}>
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Image src="/MinusCircle.svg" alt="Minimizar" width={20} height={20} />
                        <Image src="/DotsThreeVertical.svg" alt="Mais opções" width={20} height={20} />
                      </div>
                    </header>

                    <div className="flex items-center gap-3 w-full">
                      {c.photoUrl ? (
                        <img
                          src={c.photoUrl}
                          alt={c.userName}
                          width={40}
                          height={40}
                          style={{ borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <Image src="/User.svg" alt="Avatar" width={40} height={40} style={{ borderRadius: 8 }} />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span style={{ color: "#361A6D", fontSize: 14, fontWeight: 500 }}>{c.userName}</span>
                        <span style={{ color: "#6B4DB8", fontSize: 14, fontWeight: 400 }}>{c.nickname}</span>
                      </div>
                    </div>

                    <Link
                      href={`/support/chat/${c.id}`}
                      className="mt-auto w-full flex items-center justify-center gap-2 rounded-md cursor-pointer"
                      style={{
                        padding: "10px 12px",
                        background: "#977CEC",
                        color: "#FCFDFF",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      <Image src="/Chat.svg" alt="Acessar chat" width={18} height={18} />
                      Acessar Chat
                    </Link>
                  </article>
                ))}
              </div>
              <div className="md:hidden mt-4 px-4 flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Página anterior"
                  onClick={() => goPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                  style={{ borderColor: '#D0D9F1', color: page === 1 ? '#7682A5' : '#191F33', opacity: page === 1 ? 0.5 : 1 }}
                >
                  <Image src="/Arrow.svg" alt="Anterior" width={13} height={13} className="object-contain" />
                </button>
                <div
                  ref={pagesContainerRef}
                  className="pages-scroll"
                  style={{ margin: "0 16px", display: "flex", gap: 8, alignItems: "center", overflowX: "auto", scrollBehavior: "smooth" }}
                >
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        ref={p === page ? selectedBtnRef : null}
                        onClick={() => goPage(p)}
                        className="w-10 h-10 rounded-md flex items-center justify-center cursor-pointer"
                        style={{
                          padding: "10px",
                          fontSize: "14px",
                          fontWeight: 500,
                          borderColor: "#D0D9F1",
                          borderStyle: "solid",
                          borderWidth: "1px",
                          color: p === page ? "#191F33" : "#7682A5",
                          background: "white",
                          minWidth: 40,
                          textAlign: "center",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  aria-label="Próxima página"
                  onClick={() => goPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                  style={{ borderColor: '#D0D9F1', color: page === totalPages ? '#7682A5' : '#191F33', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  <Image src="/Arrow.svg" alt="Próxima" width={13} height={13} className="object-contain rotate-180" />
                </button>
              </div>
              <div className="hidden md:flex mt-6 px-8 justify-center">
                <div className="bg-transparent p-0 flex items-center justify-center">
                    <button
                      type="button"
                      aria-label="Página anterior"
                      onClick={() => goPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                      style={{ borderColor: '#D0D9F1', color: page === 1 ? '#7682A5' : '#191F33', opacity: page === 1 ? 0.5 : 1 }}
                    >
                      <Image src="/Arrow.svg" alt="Anterior" width={13} height={13} className="object-contain" />
                    </button>

                    <div
                      ref={pagesContainerRef}
                      className="pages-scroll"
                      style={{ margin: "0 24px", display: "flex", gap: 8, alignItems: "center", overflowX: "auto", scrollBehavior: "smooth" }}
                    >
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                          <button
                            key={p}
                            ref={p === page ? selectedBtnRef : null}
                            onClick={() => goPage(p)}
                            className="w-12 h-12 rounded-md flex items-center justify-center cursor-pointer"
                            style={{
                              padding: "12px",
                              fontSize: "14px",
                              fontWeight: 500,
                              borderColor: "#D0D9F1",
                              borderStyle: "solid",
                              borderWidth: "1px",
                              color: p === page ? "#191F33" : "#7682A5",
                              background: "white",
                              minWidth: 44,
                              textAlign: "center",
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      aria-label="Próxima página"
                      onClick={() => goPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-2 rounded-md border bg-white flex items-center justify-center cursor-pointer"
                      style={{ borderColor: '#D0D9F1', color: page === totalPages ? '#7682A5' : '#191F33', opacity: page === totalPages ? 0.5 : 1 }}
                    >
                      <Image src="/Arrow.svg" alt="Próxima" width={13} height={13} className="object-contain rotate-180" />
                    </button>
                  </div>
                </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
