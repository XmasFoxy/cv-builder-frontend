"use client";

import { useRouter } from "next/navigation";
import { ErrorAction } from "./error-screen";

export function GoBackButton() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return <ErrorAction onClick={goBack}>GO BACK</ErrorAction>;
}
