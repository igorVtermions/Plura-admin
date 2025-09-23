"use client";

import { usePathname } from "@/lib/router";
import Header from "./header";

function normalizePath(raw: string) {
  let p = (raw || "/").split(/[?#]/)[0].replace(/\/$/, "");
  if (p === "") p = "/";
  const segments = p.split("/").filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0];
    if (/^[a-z]{2}(-[a-z]{2,4})?$/i.test(first)) {
      const rest = segments.slice(1);
      p = rest.length ? "/" + rest.join("/") : "/";
    }
  }

  return p;
}

export default function HeaderWrapper() {
  const pathname = usePathname() ?? "/";
  const p = normalizePath(pathname);
  const hidePaths = [
    "/",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/password/reset",
    "/verify",
  ];

  const isAuthPath = hidePaths.some((path) => p === path || p.startsWith(path + "/"));

  if (isAuthPath) return null;

  return <Header adminName="Administrador" />;
}
