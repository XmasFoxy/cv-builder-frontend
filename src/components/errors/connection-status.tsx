"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RetryScreen } from "./retry-screen";

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function ConnectionStatus({ children }: { children: ReactNode }) {
  const router = useRouter();
  const online = useSyncExternalStore(subscribeToConnection, () => navigator.onLine, () => true);
  const [awaitingRetry, setAwaitingRetry] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const showRetry = !online || awaitingRetry;

  useEffect(() => {
    function connectionLost() {
      setAwaitingRetry(true);
      setRetryAttempted(false);
    }
    window.addEventListener("offline", connectionLost);
    return () => window.removeEventListener("offline", connectionLost);
  }, []);

  function retry() {
    if (!navigator.onLine) {
      setRetryAttempted(true);
      return;
    }
    setRetryAttempted(false);
    setAwaitingRetry(false);
    router.refresh();
  }

  return (
    <>
      <div className={showRetry ? "hidden" : "contents"} hidden={showRetry}>
        {children}
      </div>
      {showRetry && <RetryScreen onRetry={retry} stillOffline={!online && retryAttempted} />}
    </>
  );
}
