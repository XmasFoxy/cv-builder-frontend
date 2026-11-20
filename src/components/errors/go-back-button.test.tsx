import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NotFound from "@/app/not-found";

const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("uses the previous history entry when one is available", async () => {
  vi.spyOn(window.history, "length", "get").mockReturnValue(2);
  render(<NotFound />);

  expect(screen.getByRole("heading", { name: "Hmm..." })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "GO BACK" }));
  expect(router.back).toHaveBeenCalledOnce();
});

it("opens the application home when the page was opened directly", async () => {
  vi.spyOn(window.history, "length", "get").mockReturnValue(1);
  render(<NotFound />);

  await userEvent.click(screen.getByRole("button", { name: "GO BACK" }));
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/");
});
