import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { matchingEngine, MATCH_STATES } from '../../services/matching/matchingEngine.js';
import { OneToOneCall } from '../speaking/OneToOneCall.jsx';
import { UpgradeModal } from '../../components/common/UpgradeModal.jsx';
import { formatSecondsToTimer } from '../../utils/formatters.js';
import { FLUENCY_LEVELS, PRACTICE_TOPICS } from '../../config/constants.js';
import {
  Mic,
  Video,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Settings2,
  Play
} from 'lucide-react';

export function MatchingLobby() {
  const { currentUser, remainingSeconds, recordSpeakingTime, isApproved, switchDemoRole } = useAuth();
  const { addToast } = useNotification();

  const [matchState, setMatchState] = useState(MATCH_STATES.IDLE);
  const [candidate, setCandidate] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [targetLevel, setTargetLevel] = useState(currentUser?.target_level || 'Intermediate');
  const [audioOnly, setAudioOnly] = useState(false);
  const [activePartner, setActivePartner] = useState(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0);

  // Subscribe to matching engine state transitions
  useEffect(() => {
    const unsubscribe = matchingEngine.subscribe((event, payload) => {
      if (event === 'state_change') {
        setMatchState(payload.state);
        if (payload.candidate) setCandidate(payload.candidate);
        if (payload.timeoutSeconds) setCountdown(payload.timeoutSeconds);

        if (payload.state === MATCH_STATES.CONNECTED) {
          setActivePartner(payload.candidate);
          addToast(`Connected with ${payload.candidate.full_name}!`, 'success');
        } else if (payload.state === MATCH_STATES.EXHAUSTED) {
          setIsUpgradeOpen(true);
        } else if (payload.state === MATCH_STATES.NOT_APPROVED) {
          addToast('Your account is pending community approval.', 'warning');
        } else if (payload.error) {
          addToast(payload.error, 'info');
        }
      }

      if (event === 'countdown_tick') {
        setCountdown(payload.secondsLeft);
      }
    });

    return () => {
      unsubscribe();
      matchingEngine.cancelMatching();
    };
  }, [addToast]);

  const handleStartSpeaking = async () => {
    if (remainingSeconds <= 0) {
      setIsUpgradeOpen(true);
      return;
    }
    setCompletedDuration(0);
    await matchingEngine.startMatching(currentUser, targetLevel);
  };

  const handleCancelMatching = () => {
    matchingEngine.cancelMatching();
    setCandidate(null);
  };

  // Called when call ends
  const handleEndCall = async (durationSeconds) => {
    setActivePartner(null);
    setMatchState(MATCH_STATES.IDLE);
    setCandidate(null);
    if (durationSeconds > 0) {
      await recordSpeakingTime(durationSeconds);
      setCompletedDuration(durationSeconds);
      addToast(`Practice completed: ${formatSecondsToTimer(durationSeconds)} recorded!`, 'success');
    }
  };

  // Called when user clicks "Next Partner"
  const handleNextPartner = async (prevDurationSeconds) => {
    if (prevDurationSeconds > 0) {
      await recordSpeakingTime(prevDurationSeconds);
    }
    setActivePartner(null);
    matchingEngine.cancelMatching();
    handleStartSpeaking();
  };

  // Active call view
  if (activePartner) {
    return (
      <OneToOneCall
        partner={activePartner}
        currentUser={currentUser}
        initialAudioOnly={audioOnly}
        onEndCall={handleEndCall}
        onNextPartner={handleNextPartner}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-700/50">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Real Spoken Practice Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Speak English 1-on-1 with Approved Members
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Automatic real-time partner matching. Connect instantly, talk naturally, build confidence, and get better every single day.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/40 backdrop-blur-md border border-white/10 text-xs font-bold">
              <Clock className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span>Daily Allowance:</span>
              <span className="font-mono text-sm text-amber-300">{formatSecondsToTimer(remainingSeconds)}</span>
              <span className="text-white/60">/ 20m</span>
            </div>

            <button
              onClick={() => setIsUpgradeOpen(true)}
              className="text-xs font-bold text-indigo-200 hover:text-white underline underline-offset-4"
            >
              Extend limit →
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* If completed a session recently */}
      {completedDuration > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <strong>Well done!</strong> You just completed {formatSecondsToTimer(completedDuration)} of active English conversation.
            </div>
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">Added to Today's Record</span>
        </div>
      )}

      {/* Main Matching Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* State: IDLE */}
        {matchState === MATCH_STATES.IDLE && (
          <div className="space-y-6">
            
            {/* Preferences Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              
              {/* Target Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Target Partner English Level
                </label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  {FLUENCY_LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.label} — {lvl.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Preferences */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Call Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudioOnly(false)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all ${
                      !audioOnly
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Video className="w-4 h-4" /> Video & Audio
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudioOnly(true)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all ${
                      audioOnly
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Mic className="w-4 h-4" /> Audio-Only Mode
                  </button>
                </div>
              </div>

            </div>

            {/* Speaking Safety Guarantee */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white font-semibold">SpeakMate Safe Community:</strong>{' '}
                Only verified and approved members are admitted. Personal contact details (phone, email) are strictly kept private.
              </div>
            </div>

            {/* Big Action Button */}
            <div className="text-center pt-2">
              <button
                onClick={handleStartSpeaking}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-102 transition-all flex items-center justify-center gap-3 mx-auto"
              >
                <Mic className="w-5 h-5 animate-pulse" />
                <span>Start Speaking Practice</span>
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Connects in seconds • WebRTC Encrypted • Mute and skip anytime
              </p>
            </div>

          </div>
        )}

        {/* State: SEARCHING */}
        {matchState === MATCH_STATES.SEARCHING && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                <Users className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Finding an Online Speaking Partner...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Checking online community pool matching {targetLevel} level.
              </p>
            </div>
            <button
              onClick={handleCancelMatching}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* State: REQUEST SENT (15s Countdown) */}
        {matchState === MATCH_STATES.REQUEST_SENT && candidate && (
          <div className="py-8 text-center space-y-5 max-w-sm mx-auto">
            <div className="relative w-24 h-24 mx-auto">
              <img
                src={candidate.avatar_url}
                alt={candidate.full_name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-bounce">
                {countdown}s
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                Partner Found
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Calling {candidate.full_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {candidate.target_level} English • {candidate.country || 'Bangladesh'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Waiting for partner to accept ({countdown}s left). If no response, we automatically try the next partner!
              </p>
            </div>

            <button
              onClick={handleCancelMatching}
              className="px-6 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* State: NOT APPROVED */}
        {matchState === MATCH_STATES.NOT_APPROVED && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Community Approval Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                To prevent spam and protect our community, accounts must be approved before starting 1-on-1 practice.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => switchDemoRole('admin')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
              >
                Switch to Admin & Approve My Account
              </button>
              <button
                onClick={() => setMatchState(MATCH_STATES.IDLE)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Back
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Suggested Topics Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Today's Curated Practice Prompts
            </h4>
          </div>
          <span className="text-xs text-slate-400">Great for overcoming awkward silences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRACTICE_TOPICS.slice(0, 4).map((topic, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
            >
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{topic.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{topic.prompt}</p>
            </div>
          ))}
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        remainingSeconds={remainingSeconds}
      />
    </div>
  );
}
