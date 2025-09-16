import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HeaderWrapper from "@/components/layout/header-wrapper";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plura Talks - Administrador",
  description: "Painel administrativo do Plura Talks",
  icons: {
    icon: [{ url: "/favicon.ico?v=1", type: "image/x-icon", sizes: "any" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${rubik.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SidebarProvider>
            <HeaderWrapper />
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
