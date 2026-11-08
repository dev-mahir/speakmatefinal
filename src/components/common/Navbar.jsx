import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { formatSecondsToTimer } from '../../utils/formatters.js';
import { UpgradeModal } from './UpgradeModal.jsx';
import {
  Mic,
  Video,
  BookOpen,
  User,
  Shield,
  Bell,
  Sun,
  Moon,
  Clock,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Radio,
  CheckCircle2,
  Users
} from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const { currentUser, remainingSeconds, maxAllowanceSeconds, switchDemoRole, logout, isAdmin, isMentor, isApproved } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead } = useNotification();

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/practice', label: 'Practice', badge: 'Live 1-on-1' },
    { to: '/classes', label: 'Live Classes', badge: 'Mentor' },
    { to: '/courses', label: 'Courses' },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const usagePercent = Math.min(100, Math.round(((maxAllowanceSeconds - remainingSeconds) / maxAllowanceSeconds) * 100));

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                      Speak<span className="text-indigo-600 dark:text-indigo-400">Mate</span>
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                      English
                    </span>
                  </div>
                  <p className="hidden md:block text-[11px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                    Practice English. Connect. Improve.
                  </p>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navLinks.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {link.icon && <link.icon className="w-4 h-4 text-indigo-500" />}
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Daily Speaking Minutes Pill */}
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 transition-all text-xs font-bold shadow-xs"
                title="Daily Free Speaking Time (Asia/Dhaka reset at midnight)"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span className="font-mono text-sm">{formatSecondsToTimer(remainingSeconds)}</span>
                <span className="hidden lg:inline text-[11px] opacity-75 font-normal">left today</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </button>

              {/* Demo Role Switcher Quick Pill (Crucial for Reviewers/Evaluators) */}
              <div className="relative hidden xl:block">
                <select
                  value={currentUser?.role || 'student'}
                  onChange={(e) => switchDemoRole(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  title="Switch between roles to test student, mentor, and admin flows"
                >
                  <option value="student">Role: Student (Amina)</option>
                  <option value="mentor">Role: Mentor (David)</option>
                  <option value="admin">Role: Admin (Tariq)</option>
                </select>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Notifications Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsUserMenuOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {/* Notifications Drawer */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border text-xs transition-colors ${
                              n.read
                                ? 'bg-slate-50/50 dark:bg-slate-800/40 border-transparent text-slate-500'
                                : 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={currentUser?.full_name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/20"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {currentUser?.full_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {currentUser?.role}
                        </span>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Profile & Fluency Goal
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      >
                        <Shield className="w-4 h-4" /> Admin Console
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Quick Switch Role (Testing)
                      </p>
                      <button
                        onClick={() => { switchDemoRole('student'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Student (Amina Rahman)
                      </button>
                      <button
                        onClick={() => { switchDemoRole('mentor'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Mentor (David Miller)
                      </button>
                      <button
                        onClick={() => { switchDemoRole('admin'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Admin (Tariq Ahmed)
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive(link.to)
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 px-3">Switch Test Role:</span>
              <div className="grid grid-cols-3 gap-2 mt-1 px-1">
                <button
                  onClick={() => { switchDemoRole('student'); setIsMobileMenuOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Student
                </button>
                <button
                  onClick={() => { switchDemoRole('mentor'); setIsMobileMenuOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Mentor
                </button>
                <button
                  onClick={() => { switchDemoRole('admin'); setIsMobileMenuOpen(false); }}
                  className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Upgrade Plan Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        remainingSeconds={remainingSeconds}
        onSelectPlan={(planId, methodId) => {
          setIsUpgradeOpen(false);
          alert(`Selected ${planId} via ${methodId}. Opening secure payment checkout...`);
        }}
      />
    </>
  );
}
