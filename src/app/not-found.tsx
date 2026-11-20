import type { Metadata } from "next";

import { ErrorScreen } from "@/components/errors/error-screen";
import { GoBackButton } from "@/components/errors/go-back-button";

export const metadata: Metadata = { title: "Page not found | CV Builder" };

export default function NotFound() {
  return (
    <ErrorScreen
      heading="Hmm..."
      description={
        <>
          This doesn’t seem to be the page you were looking for.
          <span className="block">Let’s get you back on track.</span>
        </>
      }
    >
      <GoBackButton />
    </ErrorScreen>
  );
}
