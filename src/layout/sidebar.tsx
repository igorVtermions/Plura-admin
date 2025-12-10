"use client";

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
  const navHorizontal = (
    <div className="flex items-center justify-around w-full">
      {items.map((it) => {
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
              style={{
                width: 44,
                height: 44,
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
    </div>
  );

  return (
    <>
      <aside
        className="hidden md:flex min-h-full flex-col items-center gap-6 py-6"
        style={{ width: 120, background: "#F7F9FF", borderRight: "1px solid #E2E8F8" }}
        aria-label="Menu lateral"
      >
        {navVertical}
      </aside>

      <div className="md:hidden">
        <div
          className="fixed left-0 right-0 flex justify-center"
          style={{
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
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F8" }}
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
            {navHorizontal}
          </div>
        </div>
      </div>
    </>
  );
}
