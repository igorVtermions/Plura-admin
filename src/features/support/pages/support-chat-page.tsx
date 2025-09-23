"use client";

import React from "react";
import { useParams } from "react-router-dom";
import Image from "@/components/ui/Image";
import Link from "@/components/router/Link";
import Modal from "@/components/ui/Modal";

export default function SupportChatPage() {
  const { id } = useParams<{ id: string }>();
  const title = `Sala de suporte #${id}`;

  const user = {
    name: "Marta Silveira",
    nickname: "@marta_silveira",
    photoUrl: "",
    role: "Neurocientista",
    about: "Olá, me chamo Marta e gostaria de fazer novas conexões!",
  };

  const [openUserInfo, setOpenUserInfo] = React.useState(false);

  return (
    <>
      <main className="p-8 flex-1 overflow-auto md:overflow-auto min-h-0 bg-white">
        <div className="max-w-5xl mx-auto w-full min-h-0">
          <div className="flex items-center gap-5 mb-4">
            <Link
              href="/support"
              aria-label="Voltar para suporte"
              className="inline-flex items-center justify-center rounded-md p-0 m-0 leading-none"
              style={{ lineHeight: 0 }}
            >
              <Image src="/Arrow.svg" alt="Voltar" width={8} height={8} />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-[32px] font-medium" style={{ color: "#191F33" }}>{title}</h1>
              <p style={{ color: "#5A6480", fontSize: 16, fontWeight: 400 }}>
                Chat geral relacionado ao tema
              </p>
            </div>
          </div>

          <section
            className="w-full overflow-hidden"
            style={{ border: "1px solid #E2E8F8", borderRadius: 12 }}
          >
            {/* Chat header */}
            <header
              className="w-full px-4 py-3 flex items-center justify-between"
              style={{ background: "#F7F9FF", borderBottom: "1px solid #E2E8F8" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    width={40}
                    height={40}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                  />
                ) : (
                  <Image src="/User.svg" alt="Avatar" width={40} height={40} style={{ borderRadius: 8 }} />
                )}
                <div className="flex flex-col min-w-0">
                  <span style={{ color: "#191F33", fontSize: 14, fontWeight: 500 }}>{user.name}</span>
                  <span style={{ color: "#5A6480", fontSize: 14, fontWeight: 400 }}>{user.nickname}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-sm cursor-pointer"
                  style={{ color: "#6B4DB8", fontWeight: 500 }}
                >
                  Ver perfil
                </button>
                <button
                  type="button"
                  aria-label="Mais opções"
                  className="cursor-pointer"
                  onClick={() => setOpenUserInfo(true)}
                  style={{ padding: 12, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: 8, border: "1px solid #D0D9F1" }}
                >
                  <Image src="/DotsThreeCircle.svg" alt="Mais opções" width={18} height={18} />
                </button>
              </div>
            </header>

            <div className="p-4" style={{ background: "#FFFFFF" }}>
              <div className="flex flex-col gap-3" style={{ minHeight: 520 }}>
                <div className="max-w-[75%]" style={{ color: "#191F33" }}>
                  <div
                    className="rounded-md"
                    style={{ background: "#FFF6EB", border: "1px solid #FFD7AD", padding: 12 }}
                  >
                    <div className="text-sm" style={{ fontWeight: 600 }}>Marta Silveira</div>
                    <div className="text-sm" style={{ marginTop: 4 }}>
                      Olá, sou Marta e tenho algumas dificuldades como ansiedade e autismo, você poderia me ajudar?
                    </div>
                  </div>
                  <div className="text-[12px] mt-2" style={{ color: "#5A6480" }}>9:25 AM</div>
                </div>

                <div className="self-end flex flex-col items-end gap-2 max-w-[75%]">
                  <div className="rounded-md text-white text-sm" style={{ background: "#977CEC", padding: 10 }}>
                    <div style={{ fontWeight: 600 }}>Você</div>
                    <div style={{ marginTop: 2 }}>Olá, nelson, tudo bem?</div>
                  </div>
                  <div className="rounded-md text-white text-sm" style={{ background: "#977CEC", padding: 10 }}>
                    Como você está? Te encontrei por aqui
                  </div>
                  <div className="text-[12px]" style={{ color: "#5A6480" }}>9:25 AM</div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3" style={{ borderTop: "1px solid #E2E8F8", background: "#F7F9FF" }}>
              <div className="w-full flex items-center gap-3">
                <div
                  className="flex-1 rounded-md bg-white"
                  style={{ border: "1px solid #E2E8F8", padding: "10px 12px" }}
                >
                  <input
                    type="text"
                    placeholder="Digite aqui..."
                    className="w-full outline-none bg-transparent"
                    style={{ fontSize: 14, color: "#191F33" }}
                  />
                </div>
                <button
                  type="button"
                  className="rounded-md cursor-pointer"
                  style={{ background: "#977CEC", width: 44, height: 44, display: "grid", placeItems: "center" }}
                  aria-label="Enviar"
                >
                  <Image src="/SendMensage.svg" alt="Enviar" width={18} height={18} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Modal
        open={openUserInfo}
        onClose={() => setOpenUserInfo(false)}
        title="Informações do usuário"
        modalStyle={{}}
        maxWidth="max-w-xl"
      >
        <div
          className="rounded-lg"
          style={{ background: "#F3F0FF", border: "1px solid #D4C7FF" }}
        >
          <div className="p-4">
            <div className="mb-3">
              <div className="text-sm font-medium" style={{ color: "#191F33" }}>Nome do Usuário</div>
              <div className="text-sm" style={{ color: "#191F33" }}>{user.name}</div>
            </div>
            <div className="mb-3">
              <div className="text-sm font-medium" style={{ color: "#191F33" }}>Cargo/Função</div>
              <div className="text-sm" style={{ color: "#191F33" }}>{user.role}</div>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#191F33" }}>Sobre</div>
              <div className="text-sm" style={{ color: "#191F33" }}>{user.about}</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="w-full rounded-md text-white cursor-pointer"
            style={{ background: "#977CEC", padding: "12px 16px", fontWeight: 500 }}
            onClick={() => setOpenUserInfo(false)}
          >
            Marcar como resolvido
          </button>
        </div>
      </Modal>
    </>
  );
}

