import type { Metadata } from "next";

import { GoBackButton } from "@/components/errors/go-back-button";

export const metadata: Metadata = { title: "Page not found | CV Builder" };

export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-heading"
      className="grid min-h-screen place-items-center bg-[#f5f5f7] px-6 py-10 text-[#2e2e2e]"
    >
      <div className="w-full max-w-[480px] text-center">
        <div aria-hidden="true" className="relative mx-auto h-[122px] w-[162px]">
          <div className="relative h-[102px] rounded-xl border-2 border-current">
            <span className="absolute left-[50px] top-[30px] size-2 rounded-full bg-current" />
            <span className="absolute right-[50px] top-[30px] size-2 rounded-full bg-current" />
            <span className="absolute left-1/2 top-[53px] h-[42px] w-16 -translate-x-1/2 rounded-[50%] border-t-2 border-current" />
          </div>
          <span className="absolute bottom-0 left-[55px] h-[22px] w-0.5 rotate-[28deg] bg-current" />
          <span className="absolute bottom-0 right-[55px] h-[22px] w-0.5 -rotate-[28deg] bg-current" />
          <span className="absolute bottom-0 left-1/2 h-0.5 w-[82px] -translate-x-1/2 rounded-full bg-current" />
        </div>

        <h1 id="not-found-heading" className="mt-6 text-[32px] leading-10 font-normal">
          Hmm...
        </h1>
        <p className="mt-6 text-base leading-6">
          This doesn’t seem to be the page you were looking for.
          <span className="block">Let’s get you back on track.</span>
        </p>
        <GoBackButton />
      </div>
    </main>
  );
}
