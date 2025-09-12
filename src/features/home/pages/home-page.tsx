"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileIconNav } from "@/components/layout/mobile-icon-nav";
 

export default function HomePage() {
  return (
    <div className="min-h-dvh w-full bg-white flex flex-col">
      <Header />
      <div className="md:hidden px-6">
        <MobileIconNav />
      </div>
      <div className="flex w-full flex-1">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 px-6 py-8" />
      </div>
    </div>
  );
}
