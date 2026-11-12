import { Phone } from "lucide-react";
import { getSiteContact } from "@/lib/queries";

export async function HeaderPhone() {
  const contact = await getSiteContact();
  if (!contact.phone || !contact.phoneDisplay) return null;

  return (
    <a
      aria-label={`Hemen ara: ${contact.phoneDisplay}`}
      className="group relative hidden shrink-0 items-center gap-2.5 rounded-sm bg-brass-300 px-3.5 py-2 text-ink transition-colors hover:bg-brass-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:flex"
      href={`tel:+${contact.phone}`}
    >
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex size-2.5"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-brand-600" />
      </span>
      <Phone
        aria-hidden="true"
        className="size-[18px] shrink-0 transition-transform duration-300 group-hover:-rotate-12"
      />
      <span className="flex flex-col leading-tight">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/60">
          Hemen Ara
        </span>
        <span className="font-mono text-xs font-semibold tracking-wide">
          {contact.phoneDisplay}
        </span>
      </span>
    </a>
  );
}

export async function HeaderPhoneBand() {
  const contact = await getSiteContact();
  if (!contact.phone || !contact.phoneDisplay) return null;

  return (
    <a
      aria-label={`Hemen ara: ${contact.phoneDisplay}`}
      className="relative flex shrink-0 items-center gap-1.5 rounded-sm bg-brass-300 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-ink transition-colors hover:bg-brass-200 sm:hidden"
      href={`tel:+${contact.phone}`}
    >
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex size-2"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-600 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
      </span>
      <Phone aria-hidden="true" className="size-3" />
      <span className="hidden min-[380px]:inline">{contact.phoneDisplay}</span>
      <span className="min-[380px]:hidden">Hemen Ara</span>
    </a>
  );
}