import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/sidebar", () => ({
  __esModule: true,
  SidebarTrigger: () => <button type="button" data-testid="sidebar-trigger">Toggle</button>
}));

const navigation = (await import("next/navigation")) as any;
const { __getMockRouter, __resetMockRouter } = navigation;

const { default: GuruWaliPage } = await import("../page");

const originalFetch = global.fetch;

describe("Guru wali dashboard page", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let pathnameSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof global.fetch;
    pathnameSpy = vi.spyOn(navigation, "usePathname").mockReturnValue("/guruwali");
    __resetMockRouter();
  });

  afterEach(() => {
    fetchMock.mockReset();
    pathnameSpy.mockRestore();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("loads supervised students and links to guruwali detail routes", async () => {
    const user = userEvent.setup();

    const sampleStudents = [
      {
        id: "wali-1",
        name: "",
        class: "XI IPS 3",
        avatar: undefined,
        activitiesCount: 8,
        lastActivity: "2024-09-19T06:15:00Z",
        status: "completed"
      }
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleStudents })
    } as Response);

    render(<GuruWaliPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/guruwali/students",
        expect.objectContaining({ cache: "no-store" })
      );
    });

    const nameFallback = await screen.findByText(/Siswa XI IPS 3/i);
    expect(nameFallback).toBeInTheDocument();

    const statsBlock = screen.getByText("Total Siswa").closest("div");
    expect(statsBlock).not.toBeNull();
    expect(within(statsBlock as HTMLElement).getByText("1")).toBeInTheDocument();

    const router = __getMockRouter();
    await user.click(screen.getByRole("button", { name: /Kalender/i }));

    expect(router.push).toHaveBeenCalledWith("/guruwali/siswa/wali-1/kalender");
  });
});
