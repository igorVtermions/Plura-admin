"use client";

import React, { useEffect, useState } from "react";
import Link from "@/router/Link";
import Image from "@/components/ui/Image";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { invokeFunction, supabase } from "@/services/api";
import Notifications from "./notifications";

type HeaderProps = {
  adminName?: string;
};

export function Header({ adminName = "Admin" }: HeaderProps) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const admin = await invokeFunction<{
          name?: string;
          fullName?: string;
          username?: string;
          email?: string;
        }>("users-me");
        const display =
          admin?.name ?? admin?.fullName ?? admin?.username ?? admin?.email ?? "Administrador";
        if (mounted) setName(String(display));
      } catch {}
    }

    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogoutConfirm() {
    setLogoutLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogoutLoading(false);
      router.push("/");
    }
  }

  const headerStyle: React.CSSProperties & Record<string, string | number> = {
    borderBottomcolor: "#E2E8F8",
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
              style={{
                color: "#6B4DB8",
                fontFamily: "var(--font-rubik)",
                fontSize: 18,
                lineHeight: "24px",
              }}
            >
              Olá, {name ?? adminName}!
            </div>
            <div className="text-xs" style={{ lineHeight: "18px", fontSize: 12, color: "#6B4DB8" }}>
              Seja bem-vindo(a)!
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Notifications />
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-10 h-10 p-2 items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid #D0D9F1", background: "#FFFFFF" }}
            aria-label="Sair"
          >
            <Image src="/Logout.svg" alt="Sair" width={20} height={20} />
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar logout"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !logoutLoading && setShowLogoutModal(false)}
            aria-hidden="true"
          />
          <div
            className="relative bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6"
            style={{ zIndex: 70 }}
          >
            <h3 className="text-base font-semibOlá mb-1 text-center">
              Tem certeza que deseja sair?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Ao sair será necessário entrar novamente para acessar a conta.
            </p>

            <div className="mt-2 flex flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
                className="w-full px-4 py-2 rounded-md bg-gray-100 text-sm text-gray-800 hover:bg-gray-200"
              >
                Cancelar
              </button>

              <Button
                type="button"
                onClick={handleLogoutConfirm}
                disabled={logoutLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {logoutLoading ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
