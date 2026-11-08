import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Award,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext.jsx';

export function CoursePlayer({ course, onBack }) {
  const { addToast } = useNotification();
  
  // Flatten all lessons for easy navigation
  const allLessons = course.sections.flatMap(sec => 
    sec.lessons.map(les => ({ ...les, sectionTitle: sec.title }))
  );

  const [activeLesson, setActiveLesson] = useState(allLessons[0] || null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set([allLessons[0]?.id]));
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const toggleLessonComplete = (lessonId) => {
    setCompletedLessonIds(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
        addToast('Lesson marked as completed! 🎉', 'success');
      }
      return next;
    });
  };

  const progressPercentage = Math.round((completedLessonIds.size / allLessons.length) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Marketplace</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course Progress</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {progressPercentage}% Completed ({completedLessonIds.size}/{allLessons.length})
            </div>
          </div>
          <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Learning Classroom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Video Player & Active Content (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video shadow-2xl border border-slate-800">
            {activeLesson?.video_url ? (
              <video
                key={activeLesson.id}
                src={activeLesson.video_url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onEnded={() => toggleLessonComplete(activeLesson.id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <Play className="w-12 h-12 mb-2 text-slate-600" />
                <span>Select a lesson to begin video playback</span>
              </div>
            )}
          </div>

          {/* Lesson Info Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {activeLesson?.sectionTitle}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {activeLesson?.title}
                </h2>
              </div>

              <button
                onClick={() => toggleLessonComplete(activeLesson.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  completedLessonIds.has(activeLesson?.id)
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedLessonIds.has(activeLesson?.id) ? 'Completed ✓' : 'Mark as Complete'}
                </span>
              </button>
            </div>

            {/* Downloadable Resources */}
            {activeLesson?.resources && activeLesson.resources.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Lesson PDF & Practice Worksheets
                </h5>
                <div className="flex flex-wrap gap-2">
                  {activeLesson.resources.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => addToast(`Downloading ${res}...`, 'info')}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{res}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Curriculum Sidebar (1 col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Course Syllabus
            </h4>
            <span className="text-xs text-slate-400">{allLessons.length} Lessons</span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
            {course.sections.map((sec, secIdx) => (
              <div key={sec.id} className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Section {secIdx + 1}: {sec.title}
                </span>

                <div className="space-y-1.5">
                  {sec.lessons.map((les) => {
                    const isSelected = activeLesson?.id === les.id;
                    const isCompleted = completedLessonIds.has(les.id);

                    return (
                      <button
                        key={les.id}
                        onClick={() => setActiveLesson({ ...les, sectionTitle: sec.title })}
                        className={`w-full p-3 rounded-2xl text-left text-xs transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 font-bold text-indigo-900 dark:text-indigo-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 truncate">
                          <p className="truncate">{les.title}</p>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5 block flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {les.duration}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
