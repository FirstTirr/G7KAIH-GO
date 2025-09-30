import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import TermsOfServicePage from "../page"

describe("TermsOfServicePage", () => {
  it("renders key sections", async () => {
    render(await TermsOfServicePage())

    expect(
      screen.getByRole("heading", { name: /Syarat dan Ketentuan Penggunaan/i })
    ).toBeInTheDocument()

    const versionLine = screen.getByText(
      (_content, element) => element?.tagName === "SPAN" && element.textContent?.includes("Versi: 1.0")
    )
    expect(versionLine).toBeInTheDocument()
    expect(screen.getAllByText(/Jurnal Harian/i).length).toBeGreaterThan(0)
  })
})
