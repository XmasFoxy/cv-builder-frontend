import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import RouteError from "@/app/error";
import { ConnectionStatus } from "./connection-status";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("keeps page state through disconnect and refreshes on Retry after reconnecting", async () => {
  const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  const user = userEvent.setup();
  render(<ConnectionStatus><input aria-label="Draft" /></ConnectionStatus>);
  const draft = screen.getByRole("textbox", { name: "Draft" });
  await user.type(draft, "preserved text");

  online.mockReturnValue(false);
  fireEvent(window, new Event("offline"));
  expect(screen.getByRole("heading", { name: "Oops" })).toBeInTheDocument();
  expect(draft).not.toBeVisible();

  await user.click(screen.getByRole("button", { name: "RETRY" }));
  expect(screen.getByRole("status")).toHaveTextContent("You’re still offline");
  expect(refresh).not.toHaveBeenCalled();

  online.mockReturnValue(true);
  fireEvent(window, new Event("online"));
  await user.click(screen.getByRole("button", { name: "RETRY" }));
  expect(refresh).toHaveBeenCalledOnce();
  expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("preserved text");
  expect(screen.queryByRole("heading", { name: "Oops" })).not.toBeInTheDocument();
});

it("shows the retry screen if the page starts offline", () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  render(<ConnectionStatus><p>Application content</p></ConnectionStatus>);

  expect(screen.getByRole("heading", { name: "Oops" })).toBeInTheDocument();
  expect(screen.getByText("Application content")).not.toBeVisible();
});

it("retries the failed route through the Next.js error boundary", async () => {
  const retry = vi.fn();
  render(<RouteError retry={retry} />);

  await userEvent.click(screen.getByRole("button", { name: "RETRY" }));
  expect(retry).toHaveBeenCalledOnce();
});
