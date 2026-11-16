import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Counter } from "./counter";
import { useCounterStore } from "@/store/use-counter-store";

describe("Counter", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("отображает начальное значение 0", () => {
    render(<Counter />);

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("увеличивает значение при нажатии +", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    await user.click(
      screen.getByRole("button", { name: "+" })
    );

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("уменьшает значение при нажатии -", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    await user.click(
      screen.getByRole("button", { name: "-" })
    );

    expect(screen.getByTestId("count")).toHaveTextContent("-1");
  });
});