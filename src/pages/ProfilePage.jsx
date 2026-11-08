import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { FLUENCY_LEVELS, COMMUNITY_STATUS } from '../config/constants.js';
import { formatSecondsToTimer } from '../utils/formatters.js';
import {
  User,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  Award,
  BookOpen
} from 'lucide-react';

export function ProfilePage() {
  const { currentUser, updateProfile, remainingSeconds, maxAllowanceSeconds, isApproved } = useAuth();
  const { addToast } = useNotification();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [nativeLanguage, setNativeLanguage] = useState(currentUser?.native_language || 'Bengali');
  const [targetLevel, setTargetLevel] = useState(currentUser?.target_level || 'Intermediate');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [country, setCountry] = useState(currentUser?.country || 'Bangladesh');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        native_language: nativeLanguage,
        target_level: targetLevel,
        bio,
        country,
      });
      addToast('Profile updated successfully!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
            alt={currentUser?.full_name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {currentUser?.full_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {currentUser?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-slate-500">{country}</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{targetLevel} Level</span>
            </div>
          </div>
        </div>

        {/* Community Status Pill */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Community Status
          </span>
          {isApproved ? (
            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Approved Member</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span>Pending Review</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 block mt-1">
            {isApproved ? 'Can match and speak with all members' : 'Under admin review for safety'}
          </span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Learning Profile & Fluency Target
          </h3>
          <p className="text-xs text-slate-500">
            Helps partner matching pair you with suitable English conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Native Language (First Language)
            </label>
            <input
              type="text"
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              placeholder="e.g. Bengali, Hindi, Urdu, Spanish"
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Fluency Level
            </label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {FLUENCY_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.label} — {lvl.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Country
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Bio & Learning Goals
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share why you are practicing English (e.g., preparing for IELTS, job interviews, or casual conversation)..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Daily allowance: {formatSecondsToTimer(remainingSeconds)} remaining</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
