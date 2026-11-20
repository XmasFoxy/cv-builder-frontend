import { ErrorAction, ErrorScreen } from "./error-screen";

export function RetryScreen({
  onRetry,
  stillOffline = false,
}: {
  onRetry: () => void;
  stillOffline?: boolean;
}) {
  return (
    <ErrorScreen
      heading="Oops"
      description={
        <>
          Something went wrong. We’re already working on fixing it.
          <span className="block">Please try again or go back.</span>
        </>
      }
    >
      {stillOffline && (
        <p role="status" className="mt-4 text-sm">
          You’re still offline. Reconnect and try again.
        </p>
      )}
      <ErrorAction onClick={onRetry}>RETRY</ErrorAction>
    </ErrorScreen>
  );
}
