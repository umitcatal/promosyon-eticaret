"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductImage({
  src,
  alt,
  fallbackLabel,
  sizes,
  priority,
  className,
  fallbackClassName,
  onError,
  unoptimized,
}: {
  src: string | null | undefined;
  alt: string;
  fallbackLabel?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackClassName?: string;
  onError?: () => void;
  unoptimized?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    const label = (fallbackLabel ?? alt).trim();
    return (
      <div
        aria-label={alt}
        className={
          fallbackClassName ??
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-zinc-50 to-zinc-100"
        }
        role="img"
      >
        <span className="text-4xl font-bold text-orange-200">
          {label.charAt(0).toLocaleUpperCase("tr")}
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      fill
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
      priority={priority}
      sizes={sizes}
      src={src}
      unoptimized={unoptimized}
    />
  );
}
