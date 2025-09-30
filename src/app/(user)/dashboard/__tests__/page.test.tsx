import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/dashboard/SubmissionWindowToggle", () => ({
  SubmissionWindowToggle: () => <div data-testid="submission-toggle">Toggle</div>
}));

vi.mock("@/components/users/pending-accounts", () => ({
  __esModule: true,
  default: () => <div data-testid="pending-accounts">Pending</div>
}));

vi.mock("@/components/users/users-table", () => ({
  __esModule: true,
  default: () => <div data-testid="users-table">Users</div>
}));

const { default: DashboardPage } = await import("../page");

describe("Dashboard Page", () => {
  it("includes dashboard widgets", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("submission-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("pending-accounts")).toBeInTheDocument();
    expect(screen.getByTestId("users-table")).toBeInTheDocument();
  });
});
