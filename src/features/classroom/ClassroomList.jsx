import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/supabase/dbService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { CreateClassModal } from './CreateClassModal.jsx';
import { LiveClassroom } from './LiveClassroom.jsx';
import { CLASSROOM_MODES } from '../../config/constants.js';
import { formatDate } from '../../utils/formatters.js';
import {
  Users,
  Radio,
  Plus,
  Clock,
  Hand,
  Shield,
  Sparkles,
  Calendar,
  ChevronRight,
  Search
} from 'lucide-react';

export function ClassroomList() {
  const { currentUser, isMentor } = useAuth();
  const [classes, setClasses] = useState([]);
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadClasses = async () => {
    const list = await dbService.getLiveClasses();
    setClasses(list);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const filtered = classes.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mentor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeClassroom) {
    return (
      <LiveClassroom
        classroom={activeClassroom}
        currentUser={currentUser}
        onLeaveClass={() => {
          setActiveClassroom(null);
          loadClasses();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Live Mentor Sessions & Roundtables</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            English Mentor Classrooms
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-1">
            Join live workshops hosted by certified teachers. Participate in structured discussions with Raise Hand or open group debates.
          </p>
        </div>

        {isMentor && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Host New Class</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes or mentors..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
          <span>{filtered.length} Classrooms Available</span>
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => {
          const isLive = c.status === 'live';
          return (
            <div
              key={c.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                isLive
                  ? 'bg-white dark:bg-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Live Now
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3 h-3" /> Scheduled
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                      {c.speaking_mode === CLASSROOM_MODES.RAISE_HAND ? '✋ Raise Hand' : '🎙️ Open Discussion'}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {c.duration_minutes}m
                  </span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Mentor row */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <img
                    src={c.mentor_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                    alt={c.mentor_name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      {c.mentor_name}
                      <Shield className="w-3 h-3 text-indigo-500" />
                    </h5>
                    <span className="text-[10px] text-slate-400">Certified English Instructor</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3">
                <button
                  onClick={() => setActiveClassroom(c)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isLive
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:scale-101'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{isLive ? 'Join Live Classroom Now' : 'Enter Classroom Lounge'}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mentor={currentUser}
        onClassCreated={(newClass) => {
          setClasses(prev => [newClass, ...prev]);
          setActiveClassroom(newClass);
        }}
      />
    </div>
  );
}
