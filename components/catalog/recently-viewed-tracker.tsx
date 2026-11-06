"use client";

import { useEffect } from "react";
import { recordRecentlyViewedProduct } from "@/lib/recently-viewed";

export function RecentlyViewedTracker({ productId }: { productId: number }) {
  useEffect(() => {
    recordRecentlyViewedProduct(productId);
  }, [productId]);

  return null;
}
