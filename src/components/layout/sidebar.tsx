"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside
      className="min-h-full flex flex-col items-center gap-6 py-6"
      style={{ width: 120, background: "#F7F9FF", borderRight: "1px solid #E2E8F8" }}
      aria-label="Menu lateral"
    >
      <nav className="flex flex-col items-center gap-6">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center gap-1"
              aria-current={active ? "page" : undefined}
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
