import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/sidebar", () => ({
  __esModule: true,
  SidebarTrigger: () => <button type="button" data-testid="sidebar-trigger">Toggle</button>
}));

const navigation = (await import("next/navigation")) as any;
const { __getMockRouter, __resetMockRouter } = navigation;

const { default: GuruPage } = await import("../page");

const originalFetch = global.fetch;

describe("Guru dashboard page", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let pathnameSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof global.fetch;
    pathnameSpy = vi.spyOn(navigation, "usePathname").mockReturnValue("/guru");
    __resetMockRouter();
  });

  afterEach(() => {
    fetchMock.mockReset();
    pathnameSpy.mockRestore();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders student metrics, allows filtering, and routes to detail view", async () => {
  const user = userEvent.setup();

  const sampleStudents = [
      {
        id: "stu-1",
        name: "Siti Aminah",
        class: "X IPA 1",
        avatar: null,
        activitiesCount: 12,
        lastActivity: "2024-09-20T09:30:00Z",
        status: "active"
      },
      {
        id: "stu-2",
        name: "Budi Santoso",
        class: "X IPA 2",
        avatar: null,
        activitiesCount: 5,
        lastActivity: "2024-09-18T04:00:00Z",
        status: "inactive"
      }
    ];

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleStudents })
    } as Response);

    render(<GuruPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teacher/students",
        expect.objectContaining({ cache: "no-store" })
      );
    });

    expect(await screen.findByText("Siti Aminah")).toBeInTheDocument();
    const metricsSection = screen.getByText("Total Siswa").closest("div");
    expect(metricsSection).not.toBeNull();
    expect(within(metricsSection as HTMLElement).getByText(sampleStudents.length.toString())).toBeInTheDocument();

  const searchInput = screen.getByPlaceholderText("Cari siswa atau kelas...");
  await user.type(searchInput, "budi");

    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      expect(screen.queryByText("Siti Aminah")).not.toBeInTheDocument();
    });

    const router = __getMockRouter();
  await user.click(screen.getByRole("button", { name: /Detail Field/i }));

    expect(router.push).toHaveBeenCalledWith("/guru/siswa/stu-2/detail");
  });

  it("shows error feedback when the student list fails to load", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"));

    render(<GuruPage />);

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });
});
