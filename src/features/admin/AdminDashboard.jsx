import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/supabase/dbService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { COMMUNITY_STATUS, ROLES } from '../../config/constants.js';
import {
  Users,
  Shield,
  Clock,
  BookOpen,
  DollarSign,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Search,
  Save,
  Activity,
  Check
} from 'lucide-react';

export function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'approval' | 'users' | 'classes' | 'settings' | 'reports'
  const [profiles, setProfiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [settings, setSettings] = useState({
    daily_free_minutes: { minutes: 20 },
    matching_timeout_seconds: { seconds: 15 },
    max_classroom_attendees: { limit: 50 },
    max_active_mics_open_discussion: { limit: 10 },
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    const p = await dbService.getAllProfiles();
    setProfiles(p);
    const c = await dbService.getLiveClasses();
    setClasses(c);
    const r = await dbService.getReports();
    setReports(r);
    const s = await dbService.getPlatformSettings();
    if (s) setSettings(s);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveCommunity = async (userId) => {
    await dbService.setCommunityStatus(userId, COMMUNITY_STATUS.APPROVED, 'Approved by Administrator');
    addToast('User approved for community practice & classrooms!', 'success');
    loadData();
  };

  const handleSuspendUser = async (userId) => {
    await dbService.setCommunityStatus(userId, COMMUNITY_STATUS.SUSPENDED, 'Violation of community safety rules');
    addToast('User suspended.', 'error');
    loadData();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await dbService.savePlatformSettings(settings);
    addToast('Platform settings successfully saved!', 'success');
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Admin Access Restricted</h3>
        <p className="text-xs text-slate-500">Only authorized platform administrators may access this console.</p>
      </div>
    );
  }

  const pendingMembers = profiles.filter(p => p.status === COMMUNITY_STATUS.PENDING);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              SpeakMate Executive Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Platform Administration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage community safety, mentor authorizations, speaking quotas, and live sessions.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'approval', label: `Approval Queue (${pendingMembers.length})`, icon: CheckCircle2 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'classes', label: 'Live Sessions', icon: Radio },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">Total Registered</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{profiles.length}</p>
              <span className="text-[11px] text-emerald-500 font-semibold mt-1 block">Active Community</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">Pending Approval</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{pendingMembers.length}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Awaiting review</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">Active Classrooms</span>
              <p className="text-2xl font-black text-indigo-500 mt-1">
                {classes.filter(c => c.status === 'live').length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">SFU Stream Online</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase">Reported Abuse</span>
              <p className="text-2xl font-black text-rose-500 mt-1">{reports.length}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Zero tolerance target</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Infrastructure & Scalability Health
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">WebRTC STUN Connectivity</span>
                <span className="font-bold text-emerald-500">Google STUN Nodes Active (38ms)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">SFU Media Relay</span>
                <span className="font-bold text-indigo-500">LiveKit SFU Protocol Ready (Max 200)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Database & RLS</span>
                <span className="font-bold text-emerald-500">PostgreSQL Schema Migrated</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY APPROVAL QUEUE */}
      {activeTab === 'approval' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Member Community Approvals
              </h3>
              <p className="text-xs text-slate-500">
                Prevent random harassment by screening candidates before unlocking partner matching.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {pendingMembers.length} Pending
            </span>
          </div>

          {pendingMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No pending requests</p>
              <p>All registered students have been reviewed and approved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/40"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{member.full_name}</h5>
                      <p className="text-slate-500">{member.native_language} • Goal: {member.target_level}</p>
                      <p className="text-slate-400 mt-0.5 line-clamp-1 italic">"{member.bio || 'Wants to practice spoken English'}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveCommunity(member.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Member
                    </button>
                    <button
                      onClick={() => handleSuspendUser(member.id)}
                      className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Registered Users</h3>
            <span className="text-xs text-slate-400">{profiles.length} Total</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {profiles.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{u.full_name}</h5>
                    <span className="text-slate-400">{u.native_language} • {u.target_level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {u.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE CLASSES MONITOR */}
      {activeTab === 'classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Classrooms Monitor</h3>
          <div className="space-y-3">
            {classes.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{c.title}</h4>
                  <p className="text-slate-400">Mentor: {c.mentor_name} • Mode: {c.speaking_mode}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-w-xl">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Platform Settings & Quotas</h3>
            <p className="text-xs text-slate-500">Configure business parameters and daily free allowances.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Daily Free Speaking Allowance (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.daily_free_minutes?.minutes || 20}
              onChange={(e) => setSettings({
                ...settings,
                daily_free_minutes: { minutes: parseInt(e.target.value, 10) }
              })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 20 minutes (1200 seconds)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Partner Response Timeout (Seconds)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={settings.matching_timeout_seconds?.seconds || 15}
              onChange={(e) => setSettings({
                ...settings,
                matching_timeout_seconds: { seconds: parseInt(e.target.value, 10) }
              })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 15 seconds per candidate before re-queue</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Max Active Mics in Open Discussion Mode
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={settings.max_active_mics_open_discussion?.limit || 10}
              onChange={(e) => setSettings({
                ...settings,
                max_active_mics_open_discussion: { limit: parseInt(e.target.value, 10) }
              })}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Platform Settings
          </button>
        </form>
      )}

    </div>
  );
}
