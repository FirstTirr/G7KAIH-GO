import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("../action", () => ({
  login: vi.fn()
}));

vi.mock("@/components/ui/googleButton", () => ({
  __esModule: true,
  default: () => <button data-testid="google-signin">Continue with Google</button>
}));

const { login } = await import("../action");
const { useRouter } = await import("next/navigation");
const { default: LoginPage } = await import("../page");

const getRouter = () => useRouter();
const loginMock = login as unknown as Mock;

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockReset();
    process.env.NEXT_PUBLIC_DATA_SITEKEY = "test-sitekey";
    delete (window as any).grecaptcha;
    delete (window as any).onRecaptchaLoad;
    document.getElementById("recaptcha-script")?.remove();
  });

  it("renders the login form", () => {
    (window as any).grecaptcha = {
      render: vi.fn(),
      getResponse: vi.fn(() => ""),
      reset: vi.fn()
    };

  render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /login page/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByTestId("google-signin")).toBeInTheDocument();
  });

  it("shows an error when reCAPTCHA is not ready", async () => {
  render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });

    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    expect(await screen.findByText(/reCAPTCHA belum siap/i)).toBeInTheDocument();
  expect(loginMock.mock.calls.length).toBe(0);
  });

  it("requires users to complete reCAPTCHA", async () => {
    (window as any).grecaptcha = {
      render: vi.fn(),
      getResponse: vi.fn(() => ""),
      reset: vi.fn()
    };

  render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });

    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    expect(await screen.findByText(/Silakan selesaikan reCAPTCHA/i)).toBeInTheDocument();
  expect(loginMock.mock.calls.length).toBe(0);
  });

  it("submits when reCAPTCHA token is present", async () => {
    const reset = vi.fn();
    (window as any).grecaptcha = {
      render: vi.fn(),
      getResponse: vi.fn(() => "recaptcha-token"),
      reset
    };

    const router = getRouter();
  render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });

    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(router.refresh).toHaveBeenCalled();
    });

    const formData = loginMock.mock.calls[0][0] as FormData;
    expect(formData.get("email")).toBe("student@example.com");
    expect(formData.get("password")).toBe("secret");
    expect(formData.get("g-recaptcha-response")).toBe("recaptcha-token");
    expect(reset).toHaveBeenCalled();
  });

  it("toggles password visibility", () => {
    (window as any).grecaptcha = {
      render: vi.fn(),
      getResponse: vi.fn(() => ""),
      reset: vi.fn()
    };

  render(<LoginPage />);

  const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
  const toggleButton = (passwordInput.parentElement as HTMLElement).querySelector("button") as HTMLButtonElement;

    expect(passwordInput.type).toBe("password");
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("text");
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe("password");
  });
});
