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
      <div className="any-page" style={{ maxWidth: 460 }}>
        <h1 className="any-title" style={{ fontSize: "clamp(34px, 6vw, 40px)" }}>
          Facility
          <br />
          <span className="any-title-accent">profile</span>
        </h1>
        <p style={{ color: "#999", margin: 0 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <ProfileEditor
      initialProfile={initialProfile}
      title="Edit facility profile"
      titleAccent="for better matches"
      subtitle="Keep your temperature ranges, demand or output, and operating schedule current so HeatREco can refresh match quality."
      submitLabel="Save profile"
      onSubmit={async (nextProfile) => {
        await profileApi.upsert(nextProfile);
        router.push("/dashboard");
      }}
    />
  );
}
