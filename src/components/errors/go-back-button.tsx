"use client";

import { useRouter } from "next/navigation";

export function GoBackButton() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mt-6 h-12 w-[220px] max-w-full cursor-pointer rounded-full bg-[#c82929] px-6 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#b92525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c82929] active:bg-[#a61f1f]"
    >
      GO BACK
    </button>
  );
}
