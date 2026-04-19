import PublicSurface from "@/components/layout/PublicSurface";
import MarketingNav from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }) {
  return (
    <PublicSurface>
      <MarketingNav />
      <div className="public-frame">
        <div className="public-frame-inner">{children}</div>
      </div>
    </PublicSurface>
  );
}
