import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("../action", () => ({
  login: vi.fn()
}));

const { login } = await import("../action");
const { useRouter } = await import("next/navigation");
const { default: LoginPage } = await import("../page");

const getRouter = () => useRouter();
const loginMock = login as unknown as Mock;

describe("LoginPage (token flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
  });

  it("renders the token login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("submits token and calls login", async () => {
    const router = getRouter();
    render(<LoginPage />);

    const tokenInput = screen.getByLabelText(/token/i);
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(tokenInput, { target: { value: "0000" } });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(router.refresh).toHaveBeenCalled();
    });

    const formData = loginMock.mock.calls[0][0] as FormData;
    expect(formData.get("token")).toBe("0000");
  });
});
