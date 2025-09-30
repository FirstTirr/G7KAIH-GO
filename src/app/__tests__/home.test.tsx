import { render, screen, within } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the hero heading and primary actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /membangun karakter siswa dengan g7kaih/i,
        level: 1,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /mulai sekarang/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /pelajari lebih lanjut/i })
    ).toBeInTheDocument();
  });

  it("displays hero image", () => {
    render(<Home />);

    expect(
      screen.getByRole("img", {
        name: /aktivitas siswa g7kaih/i,
      })
    ).toBeInTheDocument();
  });

  it("shows footer branding for BCS", () => {
    render(<Home />);

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByRole("img", { name: /logo bcs/i })).toBeInTheDocument();
    expect(within(footer).getByText(/platform monitoring aktivitas harian/i)).toBeInTheDocument();
    expect(within(footer).getByText(/info@g7kaih.com/i)).toBeInTheDocument();
  });
});
