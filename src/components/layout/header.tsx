"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

type HeaderProps = {
  adminName?: string;
  hasNotifications?: boolean;
};

export function Header({ adminName = "Admin", hasNotifications = false }: HeaderProps) {
  const headerStyle: React.CSSProperties & Record<string, string | number> = {
    borderBottomColor: "#E2E8F8",
    background: "#FCFDFF",
    padding: "20px",
    ["--header-height"]: "96px",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={headerStyle}>
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link href="/home" aria-label="Ir para Início" className="flex items-center">
            <Image src="/Logo.svg" alt="Plura Talks" width={40} height={40} priority />
          </Link>

          <div className="leading-none">
            <div
              className="font-medium"
              style={{ color: "#6B4DB8", fontFamily: "var(--font-rubik)", fontSize: 20, lineHeight: "26px" }}
            >
              Olá, {adminName}!
            </div>
            <div className="text-xs" style={{ lineHeight: "18px", fontSize: 14, color: "#6B4DB8" }}>
              Seja bem-vindo(a)!
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex w-12 h-12 p-3 items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid #D0D9F1", background: "#FFFFFF", color: "#191F33" }}
            aria-label="Notificações"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M7.5 17.5H12.5" stroke="#191F33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.37515 8.125C4.37515 6.63316 4.96778 5.20242 6.02267 4.14752C7.07756 3.09263 8.5083 2.5 10.0001 2.5C11.492 2.5 12.9227 3.09263 13.9776 4.14752C15.0325 5.20242 15.6251 6.63316 15.6251 8.125C15.6251 10.9234 16.2736 13.1719 16.7892 14.0625C16.844 14.1574 16.8728 14.2649 16.8729 14.3745C16.873 14.484 16.8444 14.5916 16.7898 14.6865C16.7352 14.7815 16.6566 14.8604 16.5619 14.9154C16.4672 14.9705 16.3597 14.9996 16.2501 15H3.75015C3.64076 14.9993 3.53345 14.97 3.43896 14.9149C3.34448 14.8597 3.26611 14.7808 3.2117 14.6859C3.15729 14.591 3.12874 14.4835 3.12891 14.3741C3.12907 14.2647 3.15795 14.1572 3.21265 14.0625C3.72749 13.1719 4.37515 10.9227 4.37515 8.125Z" stroke="#191F33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {hasNotifications ? (
              <span
                className="absolute right-2 top-2 block h-2 w-2 rounded-full"
                style={{ background: "#FF4D4F" }}
              />
            ) : (
              <span
                className="absolute right-2 top-2 block h-2 w-2 rounded-full"
                style={{ background: "#FFFFFF" }}
                aria-hidden
              />
            )}
          </button>

          <button
            type="button"
            className="flex w-12 h-12 p-3 items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid #D0D9F1", background: "#FFFFFF" }}
            aria-label="Sair"
          >
            <Image src="/Logout.svg" alt="Sair" width={20} height={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
