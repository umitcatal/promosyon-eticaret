type SiteLogoFallbackProps = {
  siteName: string;
  tone?: "light" | "dark";
};

export function SiteLogoFallback({
  siteName,
  tone = "light",
}: SiteLogoFallbackProps) {
  const words = siteName.trim().split(/\s+/).filter(Boolean);
  const accent = words.length > 1 ? words[words.length - 1] : "";
  const main = accent ? words.slice(0, -1).join(" ") : siteName;

  return (
    <span
      className={`font-display text-[20px] leading-none font-semibold tracking-tight ${
        tone === "dark" ? "text-paper" : "text-ink"
      }`}
    >
      {main}
      {accent ? (
        <>
          {" "}
          <span
            className={`italic ${
              tone === "dark" ? "text-brass-300" : "text-brand-600"
            }`}
          >
            {accent}
          </span>
        </>
      ) : null}
    </span>
  );
}
