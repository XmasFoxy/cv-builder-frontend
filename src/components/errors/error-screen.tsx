import { useId, type ReactNode } from "react";

export function ErrorScreen({
  heading,
  description,
  children,
}: {
  heading: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  const headingId = useId();

  return (
    <main
      aria-labelledby={headingId}
      className="grid min-h-screen place-items-center bg-[#f5f5f7] px-6 py-10 text-[#2e2e2e]"
      style={{ fontFamily: "var(--font-geist-sans, Arial), sans-serif" }}
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

        <h1 id={headingId} className="mt-6 text-[32px] leading-10 font-normal">
          {heading}
        </h1>
        <p className="mt-6 text-base leading-6">{description}</p>
        {children}
      </div>
    </main>
  );
}

export function ErrorAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 h-12 w-[220px] max-w-full cursor-pointer rounded-full bg-[#c82929] px-6 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#b92525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c82929] active:bg-[#a61f1f]"
    >
      {children}
    </button>
  );
}
