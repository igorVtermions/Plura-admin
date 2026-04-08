"use client";

import { Settings } from "lucide-react";
import Link from "@/router/Link";
import { usePathname } from "@/lib/router";
import { useSidebar } from "./sidebar-context";

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
  const pathname = usePathname();
  const { open, toggleSidebar, closeSidebar } = useSidebar();
  const MOBILE_BAR_HEIGHT = 80;
  const MOBILE_GAP = 8;

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
        className="hidden md:flex md:sticky md:top-[96px] h-[calc(100vh-96px)] shrink-0 basis-[120px] min-w-[120px] max-w-[120px] flex-col items-center py-4"
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

      <div className="md:hidden">
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            top: open
              ? `calc(var(--header-height, 96px) + ${MOBILE_GAP}px + ${MOBILE_BAR_HEIGHT}px - 12px)`
              : `calc(var(--header-height, 96px) + ${MOBILE_GAP}px - 8px)`,
            zIndex: 60,
            pointerEvents: "none",
            transition: "top 200ms ease",
          }}
        >
          <button
            type="button"
            onClick={() => toggleSidebar()}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="flex items-center justify-center rounded-full w-8 h-8 cursor-pointer pointer-events-auto"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="#425066"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          className="fixed left-0 right-0 transition-transform duration-300 ease-in-out"
          style={{
            top: `calc(var(--header-height, 96px) + ${MOBILE_GAP}px)`,
            transform: open ? "translateY(0)" : "translateY(-100%)",
            pointerEvents: open ? "auto" : "none",
            zIndex: 40,
          }}
        >
          <div className="bg-white border-b border-t border-[#E2E8F8] px-4 shadow-sm h-20 flex items-center justify-center">
            <div className="flex items-center justify-around w-full">
              {[...items, settingsItem].map((it) => {
                const active = pathname?.startsWith(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="flex items-center justify-center"
                    onClick={() => closeSidebar()}
                    aria-current={active ? "page" : undefined}
                  >
                    <div
                      className="grid place-items-center rounded-md"
                      style={{ width: 44, height: 44 }}
                      aria-hidden
                    >
                      {it.href === settingsItem.href ? (
                        <Settings
                          className={active ? "text-[#6B4DB8]" : "text-[#6C7A99]"}
                          size={26}
                          strokeWidth={1.8}
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{
                            WebkitMask: `url(${it.icon}) center / contain no-repeat`,
                            mask: `url(${it.icon}) center / contain no-repeat`,
                            background: active ? "#6B4DB8" : "#6C7A99",
                          }}
                        />
                      )}
                    </div>
                    <span className="sr-only">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
