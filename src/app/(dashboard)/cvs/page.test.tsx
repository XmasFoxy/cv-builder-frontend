import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { CvsContent } from "./cvs-content";
import { getCvs } from "./cvs-data";
import { CvsSearch } from "./cvs-search";
import { CvsTable } from "./cvs-table";
import { readCvsQuery } from "./cvs-url";
import Loading from "./loading";

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(url); },
  useRouter: () => router,
}));
vi.mock("./cvs-data", () => ({ getCvs: vi.fn() }));

const query = readCvsQuery({});
const cv = {
  id: "7",
  name: "Frontend Engineer",
  education: "Computer Science",
  user: { email: "ada@example.test" },
  description: "Builds accessible web applications.",
};
const result = { items: [cv], total: 1, page: 1, limit: 10, total_pages: 1 };

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

it("renders the CV columns, owner email, and description", async () => {
  vi.mocked(getCvs).mockResolvedValue(result);
  render(await CvsContent({ query }));

  const table = screen.getByRole("table", { name: "CVs" });
  expect(within(table).getAllByRole("columnheader").map((header) => header.textContent))
    .toEqual(["Name", "Education", "Employee", "Actions"]);
  expect(within(table).getByRole("row", { name: /Frontend Engineer/ })).toHaveTextContent(
    "Frontend EngineerComputer Scienceada@example.test",
  );
  expect(within(table).getByText(cv.description)).toBeVisible();
  expect(screen.queryByRole("navigation", { name: "CVs pagination" })).not.toBeInTheDocument();
});

it("retains headers and announces loading", () => {
  render(<Loading />);

  const table = screen.getByRole("table", { name: "CVs" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
  expect(within(table).getByRole("status")).toHaveTextContent("Loading CVs…");
});

it.each([
  ["", "You have no CVs yet"],
  ["unknown", "No CVs found"],
])("shows the expected empty state for search '%s'", async (search, message) => {
  vi.mocked(getCvs).mockResolvedValue({ ...result, items: [], total: 0, total_pages: 0 });
  render(await CvsContent({ query: { ...query, search } }));

  expect(screen.getByRole("status")).toHaveTextContent(message);
});

it("announces a load error and refreshes the current route when retried", async () => {
  vi.mocked(getCvs).mockResolvedValue(null);
  render(await CvsContent({ query: { ...query, search: "Frontend" } }));

  expect(screen.getByRole("alert")).toHaveTextContent("Failed to load CVs");
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(router.refresh).toHaveBeenCalledOnce();
});

it.each([
  ["ASC", "ascending", "descending", "&sort_by=name&sort_order=DESC"],
  ["DESC", "descending", "ascending", ""],
] as const)("links to the opposite of %s while retaining the search", (sortOrder, direction, next, sort) => {
  render(<CvsTable query={{ search: "Frontend Engineer", page: 3, sortOrder }} />);

  expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", direction);
  expect(screen.getByRole("link", { name: `Name, sort ${next}` }))
    .toHaveAttribute("href", `/cvs?search=Frontend+Engineer${sort}`);
});

it("uses the API page and limit and preserves search and sort when paging", async () => {
  vi.mocked(getCvs).mockResolvedValue({ ...result, total: 5, page: 2, limit: 2, total_pages: 3 });
  const filters = { search: "dev+team", page: 2, sortOrder: "DESC" } as const;
  render(await CvsContent({ query: filters }));

  expect(getCvs).toHaveBeenCalledWith(filters);
  expect(screen.getByText("Showing 3–3 of 5 CVs")).toBeVisible();
  const pagination = screen.getByRole("navigation", { name: "CVs pagination" });
  expect(within(pagination).getByText("Page 2 of 3")).toHaveAttribute("aria-current", "page");
  expect(within(pagination).getByRole("link", { name: "Previous" }))
    .toHaveAttribute("href", "/cvs?search=dev%2Bteam&sort_by=name&sort_order=DESC");
  expect(within(pagination).getByRole("link", { name: "Next" }))
    .toHaveAttribute("href", "/cvs?search=dev%2Bteam&page=3&sort_by=name&sort_order=DESC");
});

it("redirects a page beyond the result set to the last page", async () => {
  vi.mocked(getCvs).mockResolvedValue({ ...result, items: [], page: 5, total_pages: 2 });
  await expect(CvsContent({ query: { ...query, page: 5, search: "dev" } }))
    .rejects.toThrow("/cvs?search=dev&page=2");
});

it("applies a debounced search without reload, uses the latest sort, and resets the page", () => {
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/cvs?search=old&page=3");
  render(<CvsSearch search="old" sortOrder="ASC" />);
  const searchbox = screen.getByRole("searchbox", { name: "Search CVs by name" });
  expect(searchbox).toHaveValue("old");

  fireEvent.change(searchbox, { target: { value: " Engineer " } });
  expect(router.replace).not.toHaveBeenCalled();
  window.history.replaceState(null, "", "/cvs?search=old&sort_by=name&sort_order=DESC");
  act(() => vi.advanceTimersByTime(300));
  expect(router.replace).toHaveBeenLastCalledWith(
    "/cvs?search=Engineer&sort_by=name&sort_order=DESC", { scroll: false },
  );

  fireEvent.change(searchbox, { target: { value: "" } });
  act(() => vi.advanceTimersByTime(300));
  expect(router.replace).toHaveBeenLastCalledWith("/cvs?sort_by=name&sort_order=DESC", { scroll: false });
});

it("restores the URL search on history navigation and cancels the pending edit", () => {
  vi.useFakeTimers();
  render(<CvsSearch search="old" sortOrder="ASC" />);
  const searchbox = screen.getByRole("searchbox");

  fireEvent.change(searchbox, { target: { value: "pending" } });
  window.history.replaceState(null, "", "/cvs?search=history");
  fireEvent(window, new PopStateEvent("popstate"));
  act(() => vi.advanceTimersByTime(300));
  expect(searchbox).toHaveValue("history");
  expect(router.replace).not.toHaveBeenCalled();
});

it("falls back to the default sort and page for unsupported or duplicate parameters", () => {
  expect(readCvsQuery({ sort_by: "email", sort_order: "DESC", page: "2147483648" })).toEqual(query);
  expect(readCvsQuery(new URLSearchParams("search=one&search=two&page=1&page=2")))
    .toEqual(query);
});
