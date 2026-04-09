"use client";

import { BarChart3, CircleHelp, Home, LogOut, MessageCircleMore, Settings } from "lucide-react";
import Link from "@/router/Link";
import { usePathname } from "@/lib/router";
import { useSidebar } from "./sidebar-context";
import { useEffect } from "react";
import { useRouter } from "@/lib/router";
import { setClientToken, supabase } from "@/services/api";

type Item = {
  href: string;
  label: string;
  icon: string;
};

const items: Item[] = [
  { href: "/home", label: "Início", icon: "/Home.svg" },
  { href: "/metrics", label: "Métricas", icon: "/Analicts.svg" },
  { href: "/network", label: "Rede", icon: "/Web.svg" },
  { href: "/support", label: "Suporte", icon: "/Support.svg" },
];

const settingsItem: Item = {
  href: "/settings",
  label: "Configurações",
  icon: "/Settings.svg",
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { open, closeSidebar } = useSidebar();

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  async function handleLogout() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setClientToken(null);
    } catch (err) {
      console.error(err);
    } finally {
      closeSidebar();
      router.push("/");
    }
  }

  const mobileIconByHref: Record<string, typeof Home> = {
    "/home": Home,
    "/metrics": BarChart3,
    "/network": MessageCircleMore,
    "/support": CircleHelp,
    "/settings": Settings,
  };

  const navVertical = (
    <nav className="flex flex-col items-center gap-6">
      {items.map((it) => {
        const active = pathname?.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex flex-col items-center gap-1"
            aria-current={active ? "page" : undefined}
            onClick={() => closeSidebar()}
          >
            <div
              className="grid place-items-center rounded-md"
              style={{
                width: 60,
                height: 60,
                WebkitMask: `url(${it.icon}) center / contain no-repeat`,
                mask: `url(${it.icon}) center / contain no-repeat`,
                background: active ? "#6B4DB8" : "#6C7A99",
              }}
              aria-hidden
            />
            <span className="sr-only">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
  return (
    <>
      <aside
        className="hidden lg:flex lg:sticky lg:top-[96px] h-[calc(100vh-96px)] shrink-0 basis-[120px] min-w-[120px] max-w-[120px] flex-col items-center py-4"
        style={{ background: "#F7F9FF", borderRight: "1px solid #E2E8F8" }}
        aria-label="Menu lateral"
      >
        <nav className="flex h-full w-full min-h-0 flex-col items-center justify-between px-2">
          <div className="flex flex-col items-center gap-6">{navVertical}</div>

          {(() => {
            const active = pathname?.startsWith(settingsItem.href);
            return (
              <Link
                key={settingsItem.href}
                href={settingsItem.href}
                className="mb-2 flex flex-col items-center gap-1"
                aria-current={active ? "page" : undefined}
                onClick={() => closeSidebar()}
              >
                <div
                  className="grid place-items-center rounded-md"
                  style={{ width: 60, height: 60 }}
                  aria-hidden
                >
                  <Settings
                    className={active ? "text-[#6B4DB8]" : "text-[#6C7A99]"}
                    size={36}
                    strokeWidth={1.8}
                  />
                </div>
                <span className="sr-only">{settingsItem.label}</span>
              </Link>
            );
          })()}
        </nav>
      </aside>

      <div className="lg:hidden">
        {open && (
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/40"
          />
        )}
        <aside
          className={`fixed right-0 top-0 z-50 h-screen w-[280px] border-l border-[#E2E8F8] bg-[#F7F9FF] pt-24 transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label="Menu lateral"
        >
          <nav className="flex h-full flex-col justify-between px-4 pb-4">
            <div className="flex flex-col gap-1">
              {items.map((it) => {
                const active = pathname?.startsWith(it.href);
                const MobileIcon = mobileIconByHref[it.href] ?? Home;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                      active ? "bg-[#ECF0FD]" : "hover:bg-[#EEF2FF]"
                    }`}
                    aria-current={active ? "page" : undefined}
                    onClick={closeSidebar}
                  >
                    <MobileIcon
                      className={active ? "text-[#6B4DB8]" : "text-[#6C7A99]"}
                      size={20}
                      strokeWidth={1.9}
                      aria-hidden
                    />
                    <span className={active ? "text-[#6B4DB8]" : "text-[#425066]"}>{it.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mb-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#EEF2FF]"
              >
                <LogOut className="text-[#6C7A99]" size={20} strokeWidth={1.9} />
                <span className="text-[#425066]">Sair</span>
              </button>
              <Link
                href={settingsItem.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                  pathname?.startsWith(settingsItem.href) ? "bg-[#ECF0FD]" : "hover:bg-[#EEF2FF]"
                }`}
                aria-current={pathname?.startsWith(settingsItem.href) ? "page" : undefined}
                onClick={closeSidebar}
              >
                <Settings
                  className={pathname?.startsWith(settingsItem.href) ? "text-[#6B4DB8]" : "text-[#6C7A99]"}
                  size={20}
                  strokeWidth={1.9}
                />
                <span
                  className={pathname?.startsWith(settingsItem.href) ? "text-[#6B4DB8]" : "text-[#425066]"}
                >
                  {settingsItem.label}
                </span>
              </Link>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
