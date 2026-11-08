import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { DEFAULT_DAILY_FREE_SECONDS, CLASSROOM_MODES, ROLES, COMMUNITY_STATUS } from '../../config/constants.js';

const STORAGE_KEY_PREFIX = 'speakmate_db_';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('speakmate_events')
  : null;

// Initial pre-seeded mock dataset for instant local zero-config sandbox execution
const INITIAL_PROFILES = [
  {
    id: 'user_student_1',
    full_name: 'Amina Rahman',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Intermediate',
    bio: 'Software engineer preparing for IELTS Academic and foreign client meetings.',
    country: 'Bangladesh',
    role: 'student',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'user_mentor_1',
    full_name: 'David Miller',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    native_language: 'English (US)',
    target_level: 'Advanced',
    bio: 'CELTA-certified English instructor with 8+ years experience helping non-native speakers master natural fluency.',
    country: 'United States',
    role: 'mentor',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'user_admin_1',
    full_name: 'Tariq Ahmed',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Advanced',
    bio: 'SpeakMate platform administrator & community lead.',
    country: 'Bangladesh',
    role: 'admin',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  // Ready-to-match online community members
  {
    id: 'peer_tanvir',
    full_name: 'Tanvir Hasan',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Intermediate',
    bio: 'University student eager to practice English speaking for 20 minutes every evening!',
    country: 'Bangladesh',
    role: 'student',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'peer_sophia',
    full_name: 'Sophia Chen',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    native_language: 'Mandarin',
    target_level: 'Upper-Intermediate',
    bio: 'Product Designer practicing workplace discussions and casual banter.',
    country: 'Singapore',
    role: 'student',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'peer_karim',
    full_name: 'Rezaul Karim',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    native_language: 'Bengali',
    target_level: 'Elementary',
    bio: 'Accountant trying to overcome hesitation and build English confidence.',
    country: 'Bangladesh',
    role: 'student',
    status: 'pending', // Pending community approval demo
    created_at: new Date().toISOString(),
  }
];

const INITIAL_MENTORS = [
  {
    user_id: 'user_mentor_1',
    title: 'Senior IELTS & Fluency Coach',
    bio: 'Over 2,000 successful band 7.5+ students. Focus on natural idioms, pronunciation, and thought articulation.',
    expertise: ['IELTS Speaking Band 7+', 'Accent Reduction', 'Job Interview Prep'],
    years_experience: 8,
    rating: 4.95,
    total_students: 420,
    verified: true,
  }
];

const INITIAL_CLASSES = [
  {
    id: 'class_1',
    mentor_id: 'user_mentor_1',
    mentor_name: 'David Miller',
    mentor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    title: 'IELTS Speaking Part 2 & 3: Master the 2-Minute Monologue',
    description: 'Learn structure, signposting language, and how to avoid freezing when asked unexpected questions.',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // starts in 30 mins
    duration_minutes: 50,
    max_participants: 50,
    speaking_mode: CLASSROOM_MODES.RAISE_HAND,
    max_active_mics: 8,
    status: 'live',
    is_locked: false,
    tags: ['IELTS', 'Speaking', 'Structure'],
  },
  {
    id: 'class_2',
    mentor_id: 'user_mentor_1',
    mentor_name: 'David Miller',
    mentor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    title: 'Open Floor: Tech & Remote Work Cultural Discussions',
    description: 'Casual open round-table discussion where everyone participates and shares workplace anecdotes.',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
    duration_minutes: 45,
    max_participants: 40,
    speaking_mode: CLASSROOM_MODES.OPEN_DISCUSSION,
    max_active_mics: 12,
    status: 'scheduled',
    is_locked: false,
    tags: ['Workplace', 'Open Mic', 'Networking'],
  }
];

const INITIAL_COURSES = [
  {
    id: 'course_1',
    mentor_id: 'user_mentor_1',
    mentor_name: 'David Miller',
    title: 'Fearless English Speaking: Fluency in 30 Days',
    subtitle: 'Overcome fear, eliminate translation in your head, and speak spontaneously.',
    category: 'Conversational Fluency',
    level: 'Intermediate',
    price_cents: 120000, // ৳1,200 BDT
    currency: 'BDT',
    thumbnail_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    is_published: true,
    rating: 4.9,
    total_enrollments: 128,
    sections: [
      {
        id: 'sec_1',
        title: 'Mindset & Eliminating Translation',
        lessons: [
          {
            id: 'les_1',
            title: '1. Why You Freeze When Speaking & The 3-Second Rule',
            duration: '14 min',
            is_preview: true,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resources: ['Lesson_1_Summary.pdf', 'Confidence_Checklist.docx']
          },
          {
            id: 'les_2',
            title: '2. Thinking in English: The Environment Immersion Technique',
            duration: '18 min',
            is_preview: false,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            resources: ['Thought_Replacement_Framework.pdf']
          }
        ]
      },
      {
        id: 'sec_2',
        title: 'Conversational Connectors & Idioms',
        lessons: [
          {
            id: 'les_3',
            title: '3. Sounding Natural: Fillers that Natives Actually Use',
            duration: '22 min',
            is_preview: false,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            resources: ['Top_50_Native_Fillers.pdf']
          }
        ]
      }
    ]
  },
  {
    id: 'course_2',
    mentor_id: 'user_mentor_1',
    mentor_name: 'David Miller',
    title: 'IELTS Speaking Masterclass: Band 8 Strategy Guide',
    subtitle: 'Exact formulas for Lexical Resource, Fluency & Coherence, and Pronunciation.',
    category: 'IELTS Exam Prep',
    level: 'All Levels',
    price_cents: 185000, // ৳1,850 BDT
    currency: 'BDT',
    thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    is_published: true,
    rating: 4.96,
    total_enrollments: 240,
    sections: [
      {
        id: 'sec_201',
        title: 'IELTS Speaking Scoring Rubric Demystified',
        lessons: [
          {
            id: 'les_201',
            title: '1. What Band 8 Examiners Secretly Listen For',
            duration: '16 min',
            is_preview: true,
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            resources: ['Official_IELTS_Band_Descriptors.pdf']
          }
        ]
      }
    ]
  }
];

// Helper to get or set local database tables
function getLocalTable(table, initialData = []) {
  if (typeof window === 'undefined') return initialData;
  const raw = localStorage.getItem(STORAGE_KEY_PREFIX + table);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

function setLocalTable(table, data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(data));
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'table_update', table, timestamp: Date.now() });
  }
}

// Today's date string in Asia/Dhaka timezone (YYYY-MM-DD)
export function getDhakaDateString() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export const dbService = {
  // --- PROFILES ---
  async getProfile(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) return data;
    }
    const profiles = getLocalTable('profiles', INITIAL_PROFILES);
    return profiles.find(p => p.id === userId) || null;
  },

  async getAllProfiles() {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) return data;
    }
    return getLocalTable('profiles', INITIAL_PROFILES);
  },

  async updateProfile(userId, updates) {
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update(updates).eq('id', userId);
    }
    const profiles = getLocalTable('profiles', INITIAL_PROFILES);
    const updated = profiles.map(p => p.id === userId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
    setLocalTable('profiles', updated);
    return updated.find(p => p.id === userId);
  },

  // --- COMMUNITY APPROVAL ---
  async getCommunityRequests() {
    const profiles = await this.getAllProfiles();
    return profiles.filter(p => p.role === ROLES.STUDENT);
  },

  async setCommunityStatus(userId, status, notes = '') {
    return this.updateProfile(userId, { status, approval_notes: notes });
  },

  // --- DAILY SPEAKING MINUTES (Asia/Dhaka) ---
  async getDailySpeakingUsage(userId) {
    const today = getDhakaDateString();
    const key = `usage_${userId}_${today}`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PREFIX + key) : null;
    const settings = await this.getPlatformSettings();
    const maxAllowance = (settings?.daily_free_minutes?.minutes || 20) * 60;

    if (!raw) {
      return { usedSeconds: 0, maxAllowanceSeconds: maxAllowance, date: today };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        usedSeconds: parsed.usedSeconds || 0,
        maxAllowanceSeconds: maxAllowance,
        date: today
      };
    } catch {
      return { usedSeconds: 0, maxAllowanceSeconds: maxAllowance, date: today };
    }
  },

  async addSpeakingUsage(userId, secondsToAdd) {
    const today = getDhakaDateString();
    const current = await this.getDailySpeakingUsage(userId);
    const updatedSeconds = Math.min(
      current.maxAllowanceSeconds,
      current.usedSeconds + Math.max(0, Math.floor(secondsToAdd))
    );
    const key = `usage_${userId}_${today}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify({
        usedSeconds: updatedSeconds,
        lastUpdated: new Date().toISOString()
      }));
    }
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'usage_update', userId, usedSeconds: updatedSeconds });
    }
    return updatedSeconds;
  },

  // --- LIVE CLASSES ---
  async getLiveClasses() {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('live_classes').select('*').order('scheduled_at', { ascending: true });
      if (data) return data;
    }
    return getLocalTable('live_classes', INITIAL_CLASSES);
  },

  async getClassById(classId) {
    const classes = await this.getLiveClasses();
    return classes.find(c => c.id === classId) || null;
  },

  async createClass(classData) {
    const newClass = {
      id: `class_${Date.now()}`,
      status: 'scheduled',
      is_locked: false,
      created_at: new Date().toISOString(),
      ...classData,
    };
    const classes = getLocalTable('live_classes', INITIAL_CLASSES);
    classes.unshift(newClass);
    setLocalTable('live_classes', classes);
    return newClass;
  },

  async updateClass(classId, updates) {
    const classes = getLocalTable('live_classes', INITIAL_CLASSES);
    const updated = classes.map(c => c.id === classId ? { ...c, ...updates } : c);
    setLocalTable('live_classes', updated);
    return updated.find(c => c.id === classId);
  },

  // --- CLASS PARTICIPANTS & HAND RAISING ---
  async getClassParticipants(classId) {
    const key = `class_participants_${classId}`;
    return getLocalTable(key, [
      { id: 'user_mentor_1', name: 'David Miller', role: 'mentor', hasMic: true, isMuted: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
      { id: 'peer_tanvir', name: 'Tanvir Hasan', role: 'student', hasMic: false, isMuted: true, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200' },
      { id: 'peer_sophia', name: 'Sophia Chen', role: 'student', hasMic: false, isMuted: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
    ]);
  },

  async setClassParticipants(classId, participants) {
    const key = `class_participants_${classId}`;
    setLocalTable(key, participants);
  },

  async getSpeakingQueue(classId) {
    const key = `class_queue_${classId}`;
    return getLocalTable(key, []);
  },

  async raiseHand(classId, user) {
    const queue = await this.getSpeakingQueue(classId);
    if (queue.some(item => item.userId === user.id)) return queue;
    const item = {
      id: `hand_${Date.now()}`,
      userId: user.id,
      userName: user.name || user.full_name,
      userAvatar: user.avatar_url,
      raisedAt: new Date().toISOString(),
      status: 'waiting'
    };
    const updated = [...queue, item];
    const key = `class_queue_${classId}`;
    setLocalTable(key, updated);
    return updated;
  },

  async lowerHand(classId, userId) {
    const queue = await this.getSpeakingQueue(classId);
    const updated = queue.filter(item => item.userId !== userId);
    const key = `class_queue_${classId}`;
    setLocalTable(key, updated);
    return updated;
  },

  // --- COURSES ---
  async getCourses() {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('courses').select('*').eq('is_published', true);
      if (data) return data;
    }
    return getLocalTable('courses', INITIAL_COURSES);
  },

  async getCourseById(courseId) {
    const courses = getLocalTable('courses', INITIAL_COURSES);
    return courses.find(c => c.id === courseId) || null;
  },

  async saveCourse(courseData) {
    const courses = getLocalTable('courses', INITIAL_COURSES);
    const index = courses.findIndex(c => c.id === courseData.id);
    if (index >= 0) {
      courses[index] = { ...courses[index], ...courseData, updated_at: new Date().toISOString() };
    } else {
      courses.unshift({
        id: `course_${Date.now()}`,
        is_published: false,
        total_enrollments: 0,
        rating: 5.0,
        created_at: new Date().toISOString(),
        ...courseData
      });
    }
    setLocalTable('courses', courses);
  },

  // --- ENROLLMENTS & PAYMENTS ---
  async getEnrollments(userId) {
    const key = `enrollments_${userId}`;
    return getLocalTable(key, ['course_1']); // default enrolled in 1st course for easy student exploration
  },

  async enrollInCourse(userId, courseId, orderDetails = {}) {
    const key = `enrollments_${userId}`;
    const enrollments = getLocalTable(key, []);
    if (!enrollments.includes(courseId)) {
      enrollments.push(courseId);
      setLocalTable(key, enrollments);
    }
    // Record payment order
    const orders = getLocalTable('payment_orders', []);
    orders.unshift({
      id: `order_${Date.now()}`,
      userId,
      courseId,
      amount: orderDetails.amount || 1200,
      currency: orderDetails.currency || 'BDT',
      provider: orderDetails.provider || 'bkash',
      transactionId: orderDetails.trxId || `TXN${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    });
    setLocalTable('payment_orders', orders);
    return true;
  },

  // --- PLATFORM SETTINGS ---
  async getPlatformSettings() {
    return getLocalTable('platform_settings', {
      daily_free_minutes: { minutes: 20 },
      matching_timeout_seconds: { seconds: 15 },
      max_classroom_attendees: { limit: 50 },
      max_active_mics_open_discussion: { limit: 10 },
      payment_gateways: { bkash: true, nagad: true, sslcommerz: true }
    });
  },

  async savePlatformSettings(newSettings) {
    setLocalTable('platform_settings', newSettings);
  },

  // --- USER REPORTS & BLOCKS ---
  async reportUser(reportData) {
    const reports = getLocalTable('user_reports', []);
    reports.unshift({
      id: `rep_${Date.now()}`,
      ...reportData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    setLocalTable('user_reports', reports);
    return true;
  },

  async getReports() {
    return getLocalTable('user_reports', []);
  },

  async blockUser(blockerId, blockedId) {
    const blocks = getLocalTable('user_blocks', []);
    blocks.push({ blockerId, blockedId, createdAt: new Date().toISOString() });
    setLocalTable('user_blocks', blocks);
  },

  // Cross-tab real-time listener hook helper
  subscribe(callback) {
    if (!broadcastChannel) return () => {};
    const listener = (event) => callback(event.data);
    broadcastChannel.addEventListener('message', listener);
    return () => broadcastChannel.removeEventListener('message', listener);
  }
};
