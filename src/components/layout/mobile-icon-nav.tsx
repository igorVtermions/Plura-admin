"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/home", label: "Início", icon: "/Home.svg" },
  { href: "/metrics", label: "Métricas", icon: "/Analicts.svg" },
  { href: "/network", label: "Rede", icon: "/Web.svg" },
  { href: "/support", label: "Suporte", icon: "/Support.svg" },
];

export function MobileIconNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden w-full">
      <div className="w-full flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid place-items-center rounded-full cursor-pointer"
          style={{ width: 44, height: 44, background: "#FFFFFF" }}
          aria-expanded={open}
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" stroke="#6B4DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <nav
        className="mt-2 px-4 overflow-hidden"
        style={{ maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, transition: "max-height 250ms ease, opacity 200ms ease" }}
        aria-hidden={!open}
      >
        <ul className="flex items-center justify-center gap-6 py-2">
          {items.map((it) => {
            const active = pathname?.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link href={it.href} className="flex flex-col items-center gap-1">
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
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
