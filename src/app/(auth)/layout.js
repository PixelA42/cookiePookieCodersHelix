import PublicSurface from "@/components/layout/PublicSurface";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingNav from "@/components/marketing/MarketingNav";

export default function AuthLayout({ children }) {
  return (
    <PublicSurface>
      <MarketingNav />
      <div className="public-frame">
        <div
          className="public-frame-inner"
          style={{
            minHeight: "min(78vh, 720px)",
            display: "flex",
            flexDirection: "column",
            paddingTop: 24,
            paddingBottom: 28,
          }}
        >
          <div style={{ flex: 1, display: "grid", placeItems: "center", width: "100%" }}>{children}</div>
          <MarketingFooter />
        </div>
      </div>
    </PublicSurface>
  );
}
