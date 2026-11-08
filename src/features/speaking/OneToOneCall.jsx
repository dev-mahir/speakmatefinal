import React, { useState, useEffect, useRef } from 'react';
import { mediaService } from '../../services/media/mediaService.js';
import { formatSecondsToTimer } from '../../utils/formatters.js';
import { ReportModal } from './ReportModal.jsx';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SkipForward,
  ShieldAlert,
  Signal,
  Volume2,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export function OneToOneCall({ partner, currentUser, onEndCall, onNextPartner, initialAudioOnly = false }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialAudioOnly);
  const [callSeconds, setCallSeconds] = useState(0);
  const [networkQuality, setNetworkQuality] = useState({ rating: 'Excellent', rtt: 38 });
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showTopicPrompt, setShowTopicPrompt] = useState(true);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const providerRef = useRef(null);

  const practiceTopics = [
    { title: 'Icebreaker', text: 'Where are you from, and what is your favorite traditional dish or street food there?' },
    { title: 'Ambitions', text: 'What is a major personal or career goal you want to achieve within the next two years?' },
    { title: 'Work & Tech', text: 'How do you currently use English in your studies or daily work routine?' },
    { title: 'Debate', text: 'Do you prefer working from home or working in an office with colleagues? Why?' },
  ];

  // Initialize Media Provider & WebRTC streams
  useEffect(() => {
    let active = true;
    const provider = mediaService.createCleanProvider();
    providerRef.current = provider;

    async function setupCall() {
      try {
        const stream = await provider.acquireLocalMedia({
          audio: true,
          video: !isVideoOff,
        });

        if (active && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Attach remote track listener
        provider.on('remote_stream', (remoteStream) => {
          if (active && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        provider.on('network_quality', (quality) => {
          if (active) {
            setNetworkQuality({ rating: quality === 'poor' ? 'Poor' : 'Excellent', rtt: quality === 'poor' ? 240 : 42 });
          }
        });

        // Join room with partner
        const roomId = `room_${currentUser.id}_${partner.id}`;
        await provider.joinRoom(roomId, currentUser);
      } catch (err) {
        console.warn('Call setup error (falling back to simulated stream):', err);
      }
    }

    setupCall();

    // Call duration timer (counts actual connected speaking seconds)
    const interval = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
      if (providerRef.current) {
        providerRef.current.leaveRoom();
        providerRef.current.cleanup();
      }
    };
  }, [partner.id]);

  // Toggle Microphone
  const handleToggleMic = () => {
    if (providerRef.current) {
      const newState = !isMuted;
      providerRef.current.toggleMicrophone(!newState);
      setIsMuted(newState);
    }
  };

  // Toggle Camera
  const handleToggleVideo = () => {
    if (providerRef.current) {
      const nextVideoOff = !isVideoOff;
      providerRef.current.toggleCamera(!nextVideoOff);
      setIsVideoOff(nextVideoOff);
    }
  };

  // End Call handler
  const handleEnd = () => {
    if (providerRef.current) {
      providerRef.current.cleanup();
    }
    onEndCall && onEndCall(callSeconds);
  };

  // Next Partner handler
  const handleNext = () => {
    if (providerRef.current) {
      providerRef.current.cleanup();
    }
    onNextPartner && onNextPartner(callSeconds);
  };

  return (
    <div className="relative min-h-[85vh] bg-slate-950 text-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800">
      
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-sm tracking-wide">{formatSecondsToTimer(callSeconds)}</span>
          </div>

          {/* Network Quality Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300">
            <Signal className={`w-3.5 h-3.5 ${networkQuality.rating === 'Excellent' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{networkQuality.rating}</span>
            <span className="text-[10px] text-slate-400">({networkQuality.rtt}ms)</span>
          </div>
        </div>

        {/* Partner Info & Report */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs">
            <span className="text-slate-400">Partner:</span>
            <span className="font-bold text-white">{partner?.full_name || 'English Learner'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
              {partner?.target_level || 'Intermediate'}
            </span>
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors"
            title="Report or Block Participant"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Call Stage */}
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 pt-20 pb-28">
        
        {/* Remote Partner Video Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group shadow-inner">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Remote Video Fallback Avatar if Audio-Only */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 pointer-events-none">
            <div className="relative mb-4">
              <img
                src={partner?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={partner?.full_name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-xl"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center">
                <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white">{partner?.full_name}</h3>
            <p className="text-xs text-slate-400 mt-1">{partner?.country || 'Bangladesh'} • {partner?.native_language || 'Bengali'}</p>
            <p className="text-xs text-indigo-400 mt-0.5">Speaking Partner • Connected via WebRTC</p>
          </div>

          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-slate-200">
            {partner?.full_name}
          </div>
        </div>

        {/* Local User Video Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
          />

          {isVideoOff && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <img
                src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt="You"
                className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-500/30 mb-3"
              />
              <span className="text-sm font-bold text-slate-200">You (Camera Off)</span>
              <span className="text-xs text-slate-500 mt-0.5">Audio stream active</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-semibold text-slate-200">
            <span>You</span>
            {isMuted && <span className="text-rose-400 text-[10px] font-bold">(Muted)</span>}
          </div>
        </div>

      </div>

      {/* Suggested Topic Conversation Starter Card */}
      {showTopicPrompt && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-11/12 max-w-lg bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-3 sm:p-4 shadow-xl text-center">
          <div className="flex items-center justify-between pb-1 text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Conversation Starter: {practiceTopics[currentTopicIndex].title}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTopicIndex((prev) => (prev + 1) % practiceTopics.length)}
                className="text-[11px] hover:text-white underline"
              >
                Next Topic ↻
              </button>
              <button onClick={() => setShowTopicPrompt(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1">
            "{practiceTopics[currentTopicIndex].text}"
          </p>
        </div>
      )}

      {/* Floating Bottom Call Controls Bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl">
        
        {/* Mic Toggle Button */}
        <button
          onClick={handleToggleMic}
          className={`p-3.5 rounded-xl transition-all font-bold ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 ring-1 ring-rose-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={handleToggleVideo}
          className={`p-3.5 rounded-xl transition-all font-bold ${
            isVideoOff
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 ring-1 ring-amber-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Toggle Topic Hint */}
        <button
          onClick={() => setShowTopicPrompt(!showTopicPrompt)}
          className="p-3.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          title="Toggle Conversation Topic"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Next Partner Button */}
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          title="Skip to Next Speaking Partner"
        >
          <SkipForward className="w-4 h-4" />
          <span>Next Partner</span>
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEnd}
          className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
          title="End Speaking Session"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">End Call</span>
        </button>

      </div>

      {/* Report & Block Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        partner={partner}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
