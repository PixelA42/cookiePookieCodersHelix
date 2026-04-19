"use client";

import { useRouter } from "next/navigation";
import ProfileEditor from "@/components/domain/ProfileEditor";
import { profileApi } from "@/lib/api/client";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <ProfileEditor
      title="Set up your facility profile"
      titleAccent="for matching"
      subtitle="This onboarding flow captures the information we need to rank nearby producers and consumers with practical heat transfer potential."
      submitLabel="Save and open dashboard"
      onSubmit={async (profile) => {
        await profileApi.upsert(profile);
        router.push("/dashboard");
      }}
    />
  );
}
