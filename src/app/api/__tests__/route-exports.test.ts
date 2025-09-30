const routeModules = import.meta.glob("../**/route.{ts,tsx}", { eager: true });

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

describe("API route exports", () => {
  const entries = Object.entries(routeModules);

  it("discovers at least one API route", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  test.each(entries)("%s exposes an HTTP handler", (filePath, mod) => {
    const exportedHandlers = HTTP_METHODS.filter((method) => typeof (mod as any)[method] === "function");
    expect(exportedHandlers.length).toBeGreaterThan(0);
  });
});
