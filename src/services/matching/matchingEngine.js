import { dbService } from '../supabase/dbService.js';
import { MATCHING_TIMEOUT_SECONDS, COMMUNITY_STATUS } from '../../config/constants.js';

export const MATCH_STATES = {
  IDLE: 'idle',
  CHECKING: 'checking',
  SEARCHING: 'searching',
  REQUEST_SENT: 'request_sent',
  CONNECTED: 'connected',
  TIMEOUT: 'timeout',
  REJECTED: 'rejected',
  EXHAUSTED: 'exhausted',
  NOT_APPROVED: 'not_approved',
};

class MatchingEngine {
  constructor() {
    this.state = MATCH_STATES.IDLE;
    this.currentCandidate = null;
    this.recentAttemptedIds = new Set();
    this.timer = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      try {
        listener(event, payload);
      } catch (err) {
        console.error('MatchingEngine listener error:', err);
      }
    }
  }

  async startMatching(currentUser, targetLevel = null) {
    this.state = MATCH_STATES.CHECKING;
    this.notify('state_change', { state: this.state });

    // 1. Verify community approval
    const profile = await dbService.getProfile(currentUser.id);
    if (!profile || profile.status !== COMMUNITY_STATUS.APPROVED) {
      this.state = MATCH_STATES.NOT_APPROVED;
      this.notify('state_change', { state: this.state, reason: 'Account pending community approval.' });
      return false;
    }

    // 2. Verify remaining speaking allowance
    const usage = await dbService.getDailySpeakingUsage(currentUser.id);
    if (usage.usedSeconds >= usage.maxAllowanceSeconds) {
      this.state = MATCH_STATES.EXHAUSTED;
      this.notify('state_change', { state: this.state, usage });
      return false;
    }

    // 3. Begin searching for eligible online partners
    this.state = MATCH_STATES.SEARCHING;
    this.notify('state_change', { state: this.state });

    return this.findNextPartner(currentUser, targetLevel);
  }

  async findNextPartner(currentUser, targetLevel = null) {
    const allProfiles = await dbService.getAllProfiles();

    // Filter eligible partners:
    // - Not current user
    // - Approved community member
    // - Role is student (or mentor participating in practice)
    // - Not recently attempted in this session
    const candidates = allProfiles.filter(p => 
      p.id !== currentUser.id &&
      p.status === COMMUNITY_STATUS.APPROVED &&
      !this.recentAttemptedIds.has(p.id)
    );

    if (candidates.length === 0) {
      // If we exhausted recent list, clear recent history and try once more
      if (this.recentAttemptedIds.size > 0) {
        this.recentAttemptedIds.clear();
        return this.findNextPartner(currentUser, targetLevel);
      }
      this.state = MATCH_STATES.IDLE;
      this.notify('state_change', { state: this.state, error: 'No partners available right now. Retrying in background...' });
      return null;
    }

    // Select candidate (prefer matching level if available)
    let selected = candidates.find(c => c.target_level === targetLevel) || candidates[0];
    this.currentCandidate = selected;
    this.recentAttemptedIds.add(selected.id);

    // Transition to Request Sent
    this.state = MATCH_STATES.REQUEST_SENT;
    this.notify('state_change', { 
      state: this.state, 
      candidate: selected, 
      timeoutSeconds: MATCHING_TIMEOUT_SECONDS 
    });

    // Start 15s automatic partner response timer
    this.clearTimer();
    return new Promise((resolve) => {
      let secondsLeft = MATCHING_TIMEOUT_SECONDS;
      
      this.timer = setInterval(() => {
        secondsLeft -= 1;
        this.notify('countdown_tick', { secondsLeft });

        // Simulate realistic peer response after 3-5 seconds in sandbox
        if (secondsLeft === 11) {
          this.clearTimer();
          this.state = MATCH_STATES.CONNECTED;
          this.notify('state_change', { 
            state: this.state, 
            candidate: selected,
            roomId: `room_${Date.now()}_${currentUser.id}_${selected.id}` 
          });
          resolve(selected);
        }

        if (secondsLeft <= 0) {
          this.clearTimer();
          this.notify('state_change', { state: MATCH_STATES.TIMEOUT, candidate: selected });
          // Automatically try next partner as per requirement
          resolve(this.findNextPartner(currentUser, targetLevel));
        }
      }, 1000);
    });
  }

  cancelMatching() {
    this.clearTimer();
    this.state = MATCH_STATES.IDLE;
    this.currentCandidate = null;
    this.notify('state_change', { state: this.state });
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const matchingEngine = new MatchingEngine();
