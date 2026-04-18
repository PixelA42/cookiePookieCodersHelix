"use client";

import { useRouter } from "next/navigation";
import ProfileEditor from "@/components/domain/ProfileEditor";
import { profileApi } from "@/lib/api/client";
import { getProfile } from "@/lib/profileStorage";

export default function ProfilePage() {
  const router = useRouter();
  const profile = typeof window === "undefined" ? null : getProfile();

  return (
    <ProfileEditor
      initialProfile={profile}
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
