import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ErrorPage from "../page";

describe("Error page", () => {
  it("renders fallback message", () => {
    render(<ErrorPage />);
    expect(screen.getByText(/err/i)).toBeInTheDocument();
  });
});
