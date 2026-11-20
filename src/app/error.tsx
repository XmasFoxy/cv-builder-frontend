"use client";

import { RetryScreen } from "@/components/errors/retry-screen";

export default function Error({ retry }: { retry: () => void }) {
  return <RetryScreen onRetry={retry} />;
}
