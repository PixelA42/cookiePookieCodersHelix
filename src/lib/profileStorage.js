const PROFILE_KEY = "heatreco_profile";
const FEEDBACK_KEY = "heatreco_feedback";

export function getProfile() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}

export function getFeedback() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FEEDBACK_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveFeedback(entry) {
  if (typeof window === "undefined") return entry;
  const current = getFeedback();
  const next = [...current.filter((item) => item.matchId !== entry.matchId), entry];
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
  return entry;
}
