import { ForgotPasswordPage } from "@/app/auth/pages/forgot-password-page";
import { VerifyPage } from "@/app/verify/page";
import { HeaderWrapper } from "@/layout/header-wrapper";
import { Sidebar } from "@/layout/sidebar";
import { SidebarProvider } from "@/layout/sidebar-context";
import { ThemeProvider } from "@/components/theme-provider";
import { LoginPage } from "@/app/auth/pages/login-page";
import { RegisterPage } from "@/app/auth/pages/register-page";
import { HomePage } from "@/app/home/pages/home-page";
import { InstructorProfilePage } from "@/app/instructors/pages/instructor-profile-page";
import { InstructorsPage } from "@/app/instructors/pages/instructors-page";
import { NotFoundPage } from "@/app/not-found/pages";
import { RoomHistoryPage } from "@/app/rooms/pages/room-history-page";
import { SupportChatPage } from "@/app/support/pages/[id]/support-chat-page";
import { SupportPage } from "@/app/support/pages";
import { SupportTicketPage } from "@/app/support/pages/ticket";
import { UserProfilePage } from "@/app/users/pages/user-profile-page";
import { UsersPage } from "@/app/users/pages/users-page";
import { Toaster } from "react-hot-toast";
import { Route, Routes, useLocation } from "react-router-dom";
import { MetricsPage } from "./app/metrics/pages";
import { NetworkPage } from "./app/network/pages";
import { ProtectedRoute } from "@/app/auth/components/protected-route";

export default function App() {
  const { pathname } = useLocation();
  const hidePaths = [
    "/",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/password/reset",
    "/verify",
    "/login",
  ];
  const isAuthPath = hidePaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SidebarProvider>
        <div className="app-shell min-h-screen flex flex-col bg-white">
          <HeaderWrapper />
          <div className="flex-1 flex">
            {!isAuthPath && <Sidebar />}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify" element={<VerifyPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/support/chat/:id" element={<SupportChatPage />} />
                  <Route path="/support/ticket/:id" element={<SupportTicketPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/:userId" element={<UserProfilePage />} />
                  <Route path="/instructors" element={<InstructorsPage />} />
                  <Route path="/instructors/:instructorId" element={<InstructorProfilePage />} />
                  <Route path="/network" element={<NetworkPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="/rooms/history/:historyId" element={<RoomHistoryPage />} />
                </Route>

                <Route
                  path="*"
                  element={
                    <div className="p-6">
                      <NotFoundPage />
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
