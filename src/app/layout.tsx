import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HeaderWrapper from "@/layout/header-wrapper";
import { SidebarProvider } from "@/layout/sidebar-context";
import { Toaster } from "react-hot-toast";

// Componente de layout neutro (sem Next), Ãºtil se vocÃª quiser envolver pÃ¡ginas
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <SidebarProvider>
          <HeaderWrapper />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </div>
  );
}
