import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { Navbar } from './components/common/Navbar.jsx';
import { Footer } from './components/common/Footer.jsx';
import { MobileBottomBar } from './components/common/MobileBottomBar.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { PracticePage } from './pages/PracticePage.jsx';
import { ClassroomsPage } from './pages/ClassroomsPage.jsx';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { Sparkles } from 'lucide-react';

function QuickRoleBanner() {
  const { currentUser, switchDemoRole } = useAuth();
  return (
    <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-white">Active Evaluation Session:</span>
        <span>
          Signed in as <strong>{currentUser?.full_name}</strong> ({currentUser?.role})
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">Switch Test Profile:</span>
        <button
          onClick={() => switchDemoRole('student')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
            currentUser?.role === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:text-white'
          }`}
        >
          Student
        </button>
        <button
          onClick={() => switchDemoRole('mentor')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
            currentUser?.role === 'mentor' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:text-white'
          }`}
        >
          Mentor
        </button>
        <button
          onClick={() => switchDemoRole('admin')}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
            currentUser?.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:text-white'
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <QuickRoleBanner />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/classes" element={<ClassroomsPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
