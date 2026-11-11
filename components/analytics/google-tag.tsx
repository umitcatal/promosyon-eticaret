/* eslint-disable @next/next/no-before-interactive-script-outside-document -- App Router loads beforeInteractive scripts into <head>. */
import Script from "next/script";
import type { GoogleTagId } from "@/lib/analytics";

type GoogleTagProps = {
  tag: GoogleTagId | null;
};

export function GoogleTag({ tag }: GoogleTagProps) {
  if (!tag) return null;

  if (tag.type === "gtm") {
    return (
      <>
        <Script id="google-tag-manager-init" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
        </Script>
        <Script
          id="google-tag-manager"
          src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tag.id)}`}
          strategy="beforeInteractive"
        />
      </>
    );
  }

  return (
    <>
      <Script id="google-analytics-init" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(tag.id)});`}
      </Script>
      <Script
        id="google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tag.id)}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
