import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

const { SubmissionWindowToggle } = await import("../SubmissionWindowToggle");

type FetchMock = Mock;

const originalFetch = global.fetch;
let fetchMock: FetchMock;

describe("SubmissionWindowToggle", () => {
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

  const makeResponse = (ok: boolean, data: unknown) =>
    Promise.resolve({
      ok,
      json: async () => data
    } as Response);

  it("loads status and toggles submission window", async () => {
    fetchMock
      .mockImplementationOnce(() =>
        makeResponse(true, {
          data: {
            open: true,
            updatedAt: "2024-01-01T00:00:00.000Z",
            updatedBy: { username: "Admin" }
          }
        })
      )
      .mockImplementationOnce(() =>
        makeResponse(true, {
          data: {
            open: false,
            updatedAt: "2024-01-01T01:00:00.000Z",
            updatedBy: { username: "Admin" }
          }
        })
      );

    render(<SubmissionWindowToggle />);

    const toggleButton = await screen.findByRole("button", { name: /Tutup Pengumpulan/i });
    expect(toggleButton).toBeEnabled();

    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Buka Pengumpulan/i })).toBeEnabled();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/submission-window", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: false })
    }));
  });

  it("shows error when initial load fails and can retry", async () => {
    fetchMock
      .mockImplementationOnce(() => makeResponse(false, { error: "Server lagi down" }))
      .mockImplementationOnce(() =>
        makeResponse(true, {
          data: {
            open: false,
            updatedAt: null,
            updatedBy: null
          }
        })
      );

    render(<SubmissionWindowToggle />);

    expect(await screen.findByText(/Server lagi down/i)).toBeInTheDocument();

    const reloadButton = screen.getByRole("button", { name: /Muat ulang status/i });
    await userEvent.click(reloadButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Buka Pengumpulan/i })).toBeEnabled();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("displays error when toggle request fails and keeps previous state", async () => {
    fetchMock
      .mockImplementationOnce(() =>
        makeResponse(true, {
          data: {
            open: false,
            updatedAt: "2024-01-02T00:00:00.000Z",
            updatedBy: { username: "Admin" }
          }
        })
      )
      .mockImplementationOnce(() => makeResponse(false, { error: "Tidak boleh" }));

    render(<SubmissionWindowToggle />);

    const openButton = await screen.findByRole("button", { name: /Buka Pengumpulan/i });
    await userEvent.click(openButton);

    expect(await screen.findByText(/Tidak boleh/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buka Pengumpulan/i })).toBeEnabled();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("disables toggle button while submitting", async () => {
    const postResponse = {
      ok: true,
      json: async () => ({
        data: {
          open: false,
          updatedAt: "2024-01-03T00:00:00.000Z",
          updatedBy: { username: "Admin" }
        }
      })
    } as Response;

    let resolvePost: (value: Response) => void = () => {};
    const postPromise = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });

    fetchMock
      .mockImplementationOnce(() =>
        makeResponse(true, {
          data: {
            open: true,
            updatedAt: "2024-01-03T00:00:00.000Z",
            updatedBy: { username: "Admin" }
          }
        })
      )
      .mockImplementationOnce(() => postPromise);

    render(<SubmissionWindowToggle />);

    const toggleButton = await screen.findByRole("button", { name: /Tutup Pengumpulan/i });

    await userEvent.click(toggleButton);

    expect(toggleButton).toBeDisabled();

    resolvePost(postResponse);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Buka Pengumpulan/i })).toBeEnabled();
    });
  });
});
