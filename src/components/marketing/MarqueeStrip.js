const ITEMS = [
  "Proximity-aware pipe distance",
  "Temperature compatibility",
  "Schedule overlap",
  "AI-ranked compatibility scores",
  "Producer ↔ consumer matching",
  "Factories · data centers · greenhouses · district heat",
  "Feedback loop improves recommendations",
];

export default function MarqueeStrip() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" role="presentation" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((text, i) => (
          <span key={`${text}-${i}`} className="marquee-item">
            {text}
            <span style={{ opacity: 0.35 }}> · </span>
          </span>
        ))}
      </div>
    </div>
  );
}
