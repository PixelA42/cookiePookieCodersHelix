"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileEditor from "@/components/domain/ProfileEditor";
import { profileApi } from "@/lib/api/client";

export default function ProfilePage() {
  const router = useRouter();
  const [initialProfile, setInitialProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi
      .get()
      .then((p) => setInitialProfile(p))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="workspace-page" style={{ maxWidth: 400 }}>
        <div className="eyebrow" style={{ width: "fit-content", borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}>
          Profile
        </div>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <ProfileEditor
      initialProfile={initialProfile}
      title="Edit facility profile"
      subtitle="Keep your temperature ranges, demand or output, and operating schedule current so HeatREco can refresh match quality."
      submitLabel="Save profile"
      onSubmit={async (nextProfile) => {
        await profileApi.upsert(nextProfile);
        router.push("/dashboard");
      }}
    />
  );
}
