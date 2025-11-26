import ForgotPasswordPage from '@/app/forgot-password/page'
import ResetPasswordPage from '@/app/reset-password/page'
import VerifyPage from '@/app/verify/page'
import HeaderWrapper from '@/components/layout/header-wrapper'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { ThemeProvider } from '@/components/theme-provider'
import LoginPage from '@/features/auth/pages/login-page'
import RegisterPage from '@/features/auth/pages/register-page'
import HomePage from '@/features/home/pages/home-page'
import InstructorProfilePage from '@/features/instructors/pages/instructor-profile-page'
import InstructorsPage from '@/features/instructors/pages/instructors-page'
import NotFoundPage from '@/features/misc/pages/not-found-page'
import SupportChatPage from '@/features/support/pages/support-chat-page'
import SupportPage from '@/features/support/pages/support-page'
import UserProfilePage from '@/features/users/pages/user-profile-page'
import UsersPage from '@/features/users/pages/users-page'
import { Toaster } from 'react-hot-toast'
import { Route, Routes, useLocation } from 'react-router-dom'
import { MetricsPage } from './features/metrics/pages'
import { NetworkPage } from './features/network/pages'

export default function App() {
  const { pathname } = useLocation()
  const hidePaths = ['/', '/register', '/forgot-password', '/reset-password', '/password/reset', '/verify']
  const isAuthPath = hidePaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SidebarProvider>
        <div className="app-shell min-h-screen flex flex-col bg-white">
          <HeaderWrapper />
          <div className="flex-1 flex">
            {!isAuthPath && <Sidebar />}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/support/chat/:id" element={<SupportChatPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:userId" element={<UserProfilePage />} />
                <Route path="/instructors" element={<InstructorsPage />} />
                <Route path="/instructors/:instructorId" element={<InstructorProfilePage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/metrics" element={<MetricsPage />} />
                <Route path="*" element={<div className="p-6"><NotFoundPage /></div>} />
              </Routes>
            </main>
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
