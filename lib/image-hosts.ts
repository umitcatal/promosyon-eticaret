export const OPTIMIZABLE_IMAGE_HOSTS = [
  "akdeniz.s3.amazonaws.com",
  "akdeniz.s3.us-east-1.amazonaws.com",
] as const;

export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

export function isOptimizableImageHost(src: string): boolean {
  try {
    return (OPTIMIZABLE_IMAGE_HOSTS as readonly string[]).includes(
      new URL(src).hostname
    );
  } catch {
    return false;
  }
}
