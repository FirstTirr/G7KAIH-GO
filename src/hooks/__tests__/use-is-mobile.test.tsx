import { renderHook, waitFor } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width
  });
};

describe("useIsMobile", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it("returns true when viewport is below the breakpoint", async () => {
    setViewportWidth(500);

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns false when viewport is above the breakpoint", async () => {
    setViewportWidth(1280);

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
