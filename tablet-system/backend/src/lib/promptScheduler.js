/**
 * In-memory auto-prompt scheduler.
 * Fires "midway" at 50% of ride duration and "pre_dropoff" 5 min before arrival.
 *
 * Production upgrade path: replace Map + setTimeout with BullMQ + Redis.
 */

const timers = new Map(); // rideId → [timerId, timerId]

/**
 * Schedule both prompts for a ride.
 * @param {string} rideId
 * @param {number} etaMinutes
 * @param {(rideId: string, type: string) => void} onPrompt - callback to emit socket event
 */
function schedule(rideId, etaMinutes, onPrompt) {
  cancel(rideId); // clear any existing timers for this ride

  const midwayMs     = Math.max((etaMinutes * 0.5) * 60 * 1000, 5000);   // min 5s in dev
  const preDropoffMs = Math.max((etaMinutes - 5)   * 60 * 1000, 10000);  // min 10s in dev

  const t1 = setTimeout(() => {
    onPrompt(rideId, 'midway');
  }, midwayMs);

  const t2 = setTimeout(() => {
    onPrompt(rideId, 'pre_dropoff');
  }, preDropoffMs);

  timers.set(rideId, [t1, t2]);
}

/**
 * Reschedule when ETA is updated.
 * Remaining time = new etaMinutes from now.
 */
function reschedule(rideId, newEtaMinutes, onPrompt) {
  schedule(rideId, newEtaMinutes, onPrompt);
}

/**
 * Cancel all pending timers for a ride (on complete or cancel).
 */
function cancel(rideId) {
  const existing = timers.get(rideId);
  if (existing) {
    existing.forEach(clearTimeout);
    timers.delete(rideId);
  }
}

module.exports = { schedule, reschedule, cancel };
