"use client";

import AmbientBackground from "./AmbientBackground";

export default function PublicSurface({ children }) {
  return (
    <div className="public-chrome">
      <AmbientBackground />
      {children}
    </div>
  );
}
