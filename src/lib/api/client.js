import { getToken } from "@/lib/auth";
import { getFeedback, getProfile, saveFeedback, saveProfile } from "@/lib/profileStorage";
import { MOCK_MATCHES } from "@/lib/mockMatches";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function formatDetail(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === "object" && item.msg ? item.msg : JSON.stringify(item))).join("; ");
  }
  if (detail && typeof detail === "object" && detail.message) return String(detail.message);
  return "Request failed";
}

function normalizeRole(role) {
  if (role === "producer" || role === "consumer") return role;
  if (role === "heat-source") return "producer";
  if (role === "heat-sink") return "consumer";
  return "producer";
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function request(path, options = {}) {
  const { skipAuth, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(!skipAuth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(fetchOptions.headers || {}),
    },
    ...fetchOptions,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(formatDetail(data.detail) || data.message || "Request failed", response.status);
  }
  return data;
}

function mapProducerFromApi(p) {
  return {
    role: "producer",
    companyName: "",
    facilityName: p.facility_name,
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    location: `${p.latitude}, ${p.longitude}`,
    producerHeatGrade: "high",
    producerTemperatureC: String(p.supply_temperature_c),
    producerVolumeM3h: String(p.heat_output_kw),
    producerHeatSchedule: p.schedule_description,
    notes: "",
  };
}

function mapConsumerFromApi(p) {
  return {
    role: "consumer",
    companyName: "",
    facilityName: p.facility_name,
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    location: `${p.latitude}, ${p.longitude}`,
    consumerThermalDemandM3h: String(p.flow_rate_lph),
    consumerMinTemperatureC: String(p.demand_temperature_c),
    consumerSeasonalNeeds: "",
    consumerHeatSchedule: p.schedule_description,
    notes: "",
  };
}

async function fetchProfileFromApi() {
  for (const kind of ["producer", "consumer"]) {
    try {
      const data = await request(`/profiles/${kind}`);
      return kind === "producer" ? mapProducerFromApi(data) : mapConsumerFromApi(data);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        continue;
      }
      throw error;
    }
  }
  return null;
}

function buildProducerPayload(profile) {
  const normalized = normalizeRole(profile.role);
  return {
    facility_name: profile.facilityName.trim(),
    latitude: Number(profile.latitude),
    longitude: Number(profile.longitude),
    supply_temperature_c: Number(profile.producerTemperatureC),
    heat_output_kw: Number(profile.producerVolumeM3h),
    schedule_description: profile.producerHeatSchedule.trim(),
    role: normalized,
  };
}

function buildConsumerPayload(profile) {
  const normalized = normalizeRole(profile.role);
  return {
    facility_name: profile.facilityName.trim(),
    latitude: Number(profile.latitude),
    longitude: Number(profile.longitude),
    demand_temperature_c: Number(profile.consumerMinTemperatureC),
    flow_rate_lph: Number(profile.consumerThermalDemandM3h),
    schedule_description: profile.consumerHeatSchedule.trim(),
    role: normalized,
  };
}

function mapMatchListItem(item) {
  const score = item.compatibility_score != null ? Math.round(Number(item.compatibility_score)) : 0;
  return {
    id: String(item.match_id),
    source: "api",
    counterpartName: item.counterpart_organization_name,
    counterpartRole: item.counterpart_role,
    role: item.counterpart_role,
    score,
    distanceKm: null,
    scheduleOverlap: "—",
    temperatureFit: "—",
    summary: `Match score ${score}. Open for distance and profile detail.`,
    location: "—",
    contact: "—",
    explanation: [],
    coordinates: null,
    _raw: item,
  };
}

function mapMatchDetailToView(detail) {
  const pp = detail.producer_profile;
  const cp = detail.consumer_profile;
  if (!pp || !cp) {
    return { distanceKm: null, explanation: [], location: "—" };
  }
  const distanceKm = haversineKm(pp.latitude, pp.longitude, cp.latitude, cp.longitude);
  const temperatureGap = Math.abs(Number(pp.supply_temperature_c) - Number(cp.demand_temperature_c));
  const temperatureFit =
    Number(pp.supply_temperature_c) >= Number(cp.demand_temperature_c)
      ? `+${(pp.supply_temperature_c - cp.demand_temperature_c).toFixed(1)} C surplus`
      : `${temperatureGap.toFixed(1)} C shortfall`;

  const distanceScore = Math.max(0, Math.min(100, Math.round(100 - distanceKm * 2.5)));
  const temperatureScore = Math.max(0, Math.min(100, Math.round(100 - temperatureGap * 1.8)));
  const scheduleScore =
    pp.schedule_description && cp.schedule_description && pp.schedule_description === cp.schedule_description ? 95 : 72;

  const explanation = [
    `Producer facility ${pp.facility_name} — schedule: ${pp.schedule_description}.`,
    `Consumer facility ${cp.facility_name} — schedule: ${cp.schedule_description}.`,
    `Great-circle distance ≈ ${distanceKm.toFixed(1)} km between the two coordinates.`,
  ];
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    scheduleOverlap: pp.schedule_description === cp.schedule_description ? "Strong overlap" : "Needs validation",
    temperatureFit,
    explanation,
    location: `${pp.facility_name} ↔ ${cp.facility_name}`,
    contact: "—",
    producerSpecs: {
      facilityName: pp.facility_name,
      temperatureC: pp.supply_temperature_c,
      volumeM3h: pp.heat_output_kw,
      schedule: pp.schedule_description,
    },
    consumerSpecs: {
      facilityName: cp.facility_name,
      temperatureC: cp.demand_temperature_c,
      volumeM3h: cp.flow_rate_lph,
      schedule: cp.schedule_description,
    },
    compatibilityBreakdown: {
      distance: distanceScore,
      temperature: temperatureScore,
      schedule: scheduleScore,
    },
  };
}

export const authApi = {
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  verifyOtp(payload) {
    return request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  resendOtp(payload) {
    return request("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
};

export const profileApi = {
  async get() {
    const local = getProfile();
    if (!getToken()) return local;
    try {
      const remote = await fetchProfileFromApi();
      if (remote) {
        const merged = {
          ...local,
          ...remote,
          companyName: local?.companyName || remote?.companyName || "",
        };
        saveProfile(merged);
        return merged;
      }
    } catch {
      /* keep local */
    }
    return local;
  },

  async upsert(profile) {
    const normalizedRole = normalizeRole(profile.role);
    const normalized = { ...profile, role: normalizedRole };
    saveProfile(normalized);
    if (!getToken()) return normalized;

    const role = normalizedRole;
    const path = role === "producer" ? "/profiles/producer" : "/profiles/consumer";
    const body = role === "producer" ? buildProducerPayload(normalized) : buildConsumerPayload(normalized);

    try {
      await request(path, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return normalized;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await request(path, {
          method: "POST",
          body: JSON.stringify(body),
        });
        return normalized;
      }
      throw error;
    }
  },
};

export const matchesApi = {
  async list() {
    if (!getToken()) return MOCK_MATCHES;
    try {
      const data = await request("/matches");
      const items = data.items || [];
      if (!items.length) return [];
      return items.map(mapMatchListItem);
    } catch {
      return MOCK_MATCHES;
    }
  },

  async getDetail(matchId) {
    const id = Number(matchId);
    if (Number.isNaN(id)) return null;
    try {
      return await request(`/matches/${id}`);
    } catch {
      return null;
    }
  },

  async generate(maxCandidates = 100) {
    return request("/matches/generate", {
      method: "POST",
      body: JSON.stringify({ max_candidates: maxCandidates }),
    });
  },
};

export const feedbackApi = {
  async submit(payload) {
    const { matchId, rating, reason } = payload;
    const normalized =
      rating === "not-useful" || rating === "not_useful"
        ? "not_useful"
        : rating === "useful"
          ? "useful"
          : rating;

    const localEntry = {
      matchId,
      rating: normalized,
      reason: reason || "",
    };
    saveFeedback(localEntry);

    const numericId = Number(matchId);
    if (!getToken() || Number.isNaN(numericId) || String(matchId).startsWith("m-")) {
      return localEntry;
    }

    await request(`/matches/${numericId}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        feedback_label: normalized === "not_useful" ? "not_useful" : "useful",
      }),
    });
    return localEntry;
  },

  async list() {
    if (!getToken()) {
      return getFeedback();
    }
    try {
      const data = await request("/matches/feedback/history");
      const rows = data.items || [];
      return rows.map((row) => ({
        id: row.id,
        matchId: String(row.match_id),
        rating: row.feedback_label,
        reason: "",
        counterpartName: row.counterpart_organization_name,
        score: row.compatibility_score != null ? Math.round(Number(row.compatibility_score)) : null,
        updatedAt: row.updated_at,
      }));
    } catch {
      return getFeedback();
    }
  },
};

export const connectionsApi = {
  async list() {
    const data = await request("/connections");
    return data.items || [];
  },
  async create(payload) {
    return request("/connections", {
      method: "POST",
      body: JSON.stringify({
        match_id: Number(payload.matchId),
        message: payload.message || null,
      }),
    });
  },
  async updateStatus(requestId, status) {
    return request(`/connections/${Number(requestId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

export { mapMatchDetailToView };
