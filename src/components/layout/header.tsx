"use client";

import Link from "next/link";
import Image from "next/image";

type HeaderProps = {
  adminName?: string;
  hasNotifications?: boolean;
  onMenuClick?: () => void;
};

// Icons come from public/Bell.svg and public/Logout.svg

export function Header({ adminName = "Admin", hasNotifications = false, onMenuClick }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 w-full border-b"
      style={{ borderBottomColor: "#E2E8F8", background: "#FCFDFF", padding: "20px" }}
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center">
            <Image src="/Logo.svg" alt="Plura Talks" width={40} height={40} priority />
          </Link>
          <div className="leading-none">
            <div
              className="font-medium"
              style={{ color: "#6B4DB8", fontFamily: "var(--font-rubik)", fontSize: 20, lineHeight: "26px" }}
            >
              Olá,  {adminName}!
            </div>
            <div className="text-xs text-muted-foreground" style={{ lineHeight: "18px", fontSize: 14 }}>
              Seja bem-vindo(a)!
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex w-12 h-12 p-3 items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid #D0D9F1", background: "#FFFFFF" }}
            aria-label="Notificações"
          >
            <Image src="/Bell.svg" alt="Notificações" width={20} height={20} />
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
