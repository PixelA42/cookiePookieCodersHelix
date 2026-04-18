import { getToken } from "@/lib/auth";
import { getFeedback, getProfile, saveFeedback, saveProfile } from "@/lib/profileStorage";
import { MOCK_MATCHES } from "@/lib/mockMatches";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
}

export const authApi = {
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  verifyOtp(payload) {
    return request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  resendOtp(payload) {
    return request("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const profileApi = {
  async get() {
    return getProfile();
  },
  async upsert(payload) {
    saveProfile(payload);
    return payload;
  },
};

export const matchesApi = {
  async list() {
    return MOCK_MATCHES;
  },
};

export const feedbackApi = {
  async submit(payload) {
    saveFeedback(payload);
    return payload;
  },
  async list() {
    return getFeedback();
  },
};
