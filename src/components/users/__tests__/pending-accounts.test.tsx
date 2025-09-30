import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

const { default: PendingAccounts } = await import("../pending-accounts");

type FetchMock = Mock;

const originalFetch = global.fetch;
let fetchMock: FetchMock;

const jsonResponse = (ok: boolean, payload: unknown): Response => ({
  ok,
  json: async () => payload
}) as Response;

describe("PendingAccounts", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const queueResponses = (...responses: Response[]) => {
    fetchMock.mockImplementation(() => {
      const next = responses.shift();
      if (!next) {
        throw new Error("Unexpected fetch invocation");
      }
      return Promise.resolve(next);
    });
  };

  it("loads pending accounts and allows manual refresh", async () => {
    queueResponses(
      jsonResponse(true, {
        data: [
          {
            userid: "user-1234567890",
            username: "John Doe",
            email: "john@example.com",
            roleid: 1,
            kelas: null
          }
        ],
        total: 1
      }),
      jsonResponse(true, {
        data: [
          { roleid: 1, rolename: "Unknown" },
          { roleid: 2, rolename: "Teacher" },
          { roleid: 3, rolename: "Admin" }
        ]
      }),
      jsonResponse(true, {
        data: [
          {
            userid: "user-1234567890",
            username: "John Doe",
            email: "john@example.com",
            roleid: 1,
            kelas: null
          }
        ],
        total: 1
      }),
      jsonResponse(true, {
        data: [
          { roleid: 1, rolename: "Unknown" },
          { roleid: 2, rolename: "Teacher" },
          { roleid: 3, rolename: "Admin" }
        ]
      })
    );

    render(<PendingAccounts />);

  const nameCell = await screen.findByText("John Doe");
  const row = nameCell.closest("tr");
  expect(row).toBeTruthy();
  const roleSelect = within(row!).getByRole("combobox");

  expect(screen.getByText(/1 akun menunggu persetujuan/i)).toBeInTheDocument();
  expect(within(row!).getByRole("option", { name: "Teacher" })).toBeInTheDocument();
  expect(within(row!).queryByRole("option", { name: "Unknown" })).not.toBeInTheDocument();

    const refreshButton = screen.getByRole("button", { name: /Refresh/i });
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows error when initial load fails", async () => {
    queueResponses(
      jsonResponse(false, { error: "Gagal memuat users" }),
      jsonResponse(true, { data: [] })
    );

    render(<PendingAccounts />);

    expect(await screen.findByText(/Gagal memuat users/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("removes row after confirming new role", async () => {
    queueResponses(
      jsonResponse(true, {
        data: [
          {
            userid: "user-1234567890",
            username: "Jane",
            email: "jane@example.com",
            roleid: 1,
            kelas: null
          }
        ],
        total: 1
      }),
      jsonResponse(true, {
        data: [
          { roleid: 2, rolename: "Teacher" },
          { roleid: 3, rolename: "Admin" }
        ]
      }),
      jsonResponse(true, {
        data: {
          userid: "user-1234567890",
          username: "Jane",
          email: "jane@example.com",
          roleid: 2,
          kelas: null
        }
      })
    );

    render(<PendingAccounts />);

  const userCell = await screen.findByText("Jane");
  const row = userCell.closest("tr");
  expect(row).toBeTruthy();
  const select = within(row!).getByRole("combobox");
  await userEvent.selectOptions(select, "2");

    await waitFor(() => {
      expect(screen.getByText(/No pending accounts/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/user-profiles/user-1234567890",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleid: 2 })
      })
    );
  });

  it("shows error when role confirmation fails", async () => {
    queueResponses(
      jsonResponse(true, {
        data: [
          {
            userid: "user-777",
            username: "Failed User",
            email: "fail@example.com",
            roleid: 1,
            kelas: null
          }
        ],
        total: 1
      }),
      jsonResponse(true, {
        data: [
          { roleid: 2, rolename: "Teacher" }
        ]
      }),
      jsonResponse(false, { error: "Tidak bisa update" })
    );

    render(<PendingAccounts />);

  const failCell = await screen.findByText("Failed User");
  const row = failCell.closest("tr");
  expect(row).toBeTruthy();
  const select = within(row!).getByRole("combobox");
  await userEvent.selectOptions(select, "2");

    expect(await screen.findByText(/Tidak bisa update/i)).toBeInTheDocument();
    expect(screen.getByText("Failed User")).toBeInTheDocument();
  });

  it("applies search query when typing in filter", async () => {
    queueResponses(
      jsonResponse(true, {
        data: [],
        total: 0
      }),
      jsonResponse(true, {
        data: [
          { roleid: 2, rolename: "Teacher" }
        ]
      }),
      jsonResponse(true, {
        data: [],
        total: 0
      }),
      jsonResponse(true, {
        data: [
          { roleid: 2, rolename: "Teacher" }
        ]
      })
    );

    render(<PendingAccounts />);

    const searchInput = await screen.findByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: "andi" } });

    await waitFor(() => {
      expect(fetchMock.mock.calls[2]?.[0]).toContain("q=andi");
    });
  });
});
