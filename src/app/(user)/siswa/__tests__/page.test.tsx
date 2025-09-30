import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/components/ui/logoutButton", () => ({
  __esModule: true,
  default: () => <button data-testid="logout">Logout</button>
}));

const { default: StudentPage } = await import("../page");

const originalFetch = global.fetch;
let fetchMock: Mock;

describe("Student dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const mockFetchResponses = (...responses: Array<{ ok: boolean; json: () => Promise<any> }>) => {
    fetchMock.mockImplementation(() => {
      const response = responses.shift();
      if (!response) {
        throw new Error("Unexpected fetch call");
      }
      return Promise.resolve(response);
    });
  };

  it("shows message when submission window is closed", async () => {
    mockFetchResponses({
      ok: true,
      json: async () => ({ data: { open: false, updatedAt: null } })
    });

    render(<StudentPage />);

    expect(await screen.findByText(/Pengumpulan belum dibuka/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("renders activities, categories, and tips when submission window is open", async () => {
    mockFetchResponses(
      {
        ok: true,
        json: async () => ({ data: { open: true, updatedAt: "2024-02-01T10:00:00Z" } })
      },
      {
        ok: true,
        json: async () => ({
          data: [
            {
              kegiatanid: "1",
              kegiatanname: "Senam Pagi",
              created_at: "2024-02-01T05:00:00Z",
              categories: [
                { categoryid: "c1", categoryname: "Olahraga" },
                { categoryid: "c2", categoryname: "Kebersihan" }
              ]
            }
          ]
        })
      }
    );

    render(<StudentPage />);

    expect(await screen.findByText("Senam Pagi")).toBeInTheDocument();
    expect(screen.getByText(/Pengumpulan terbuka/i)).toBeInTheDocument();
    expect(screen.getByText("Olahraga")).toBeInTheDocument();
    expect(screen.getByTestId("logout")).toBeInTheDocument();
    expect(screen.getByText(/Tips supaya lebih cepat selesai/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Buka/i })[0]).toHaveAttribute("href", "/siswa/1");
    expect(screen.getByRole("link", { name: /Lanjut isi aktivitas pertama/i })).toHaveAttribute("href", "/siswa/1");
  });

  it("shows error message when status request fails", async () => {
    mockFetchResponses({
      ok: false,
      json: async () => ({ error: "Gagal memuat status" })
    });

    render(<StudentPage />);

    expect(await screen.findByText(/Gagal memuat status/i)).toBeInTheDocument();
  });

  it("renders empty state when no activities returned", async () => {
    mockFetchResponses(
      {
        ok: true,
        json: async () => ({ data: { open: true, updatedAt: null } })
      },
      {
        ok: true,
        json: async () => ({ data: [] })
      }
    );

    render(<StudentPage />);

    await waitFor(() => {
      expect(screen.getByText(/Belum ada kegiatan yang bisa kamu isi/i)).toBeInTheDocument();
    });
  });
});
