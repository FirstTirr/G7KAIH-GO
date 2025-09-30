import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

type LinkLike = string | URL | { pathname?: string } | undefined;
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: LinkLike;
  children: React.ReactNode;
};

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string | { src: string };
  alt: string;
};

const resolveHref = (href: LinkLike): string => {
  if (!href) return "";
  if (typeof href === "string") return href;
  if (href instanceof URL) return href.toString();
  if (typeof href === "object" && "pathname" in href) {
    return href.pathname ?? "";
  }
  return "";
};

if (typeof window !== "undefined" && !window.matchMedia) {
  // jsdom < 22 uses deprecated listener methods, ensure both variants exist
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();
  window.matchMedia = (query: string): MediaQueryList => {
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener(listener: (event: MediaQueryListEvent) => void) {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)!.add(listener);
      },
      removeListener(listener: (event: MediaQueryListEvent) => void) {
        listeners.get(query)?.delete(listener);
      },
      addEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)!.add(listener);
      },
      removeEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) {
        listeners.get(query)?.delete(listener);
      },
      dispatchEvent(_event: Event) {
        return true;
      }
    } as MediaQueryList;
    return mql;
  };
}

if (!(globalThis as any).ResizeObserver) {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: LinkProps) => {
    const resolvedHref = resolveHref(href);
    return React.createElement("a", { ...rest, href: resolvedHref }, children);
  }
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: NextImageProps) => {
    const resolvedSrc = typeof src === "string" ? src : src.src;
    return React.createElement("img", { ...rest, src: resolvedSrc, alt });
  }
}));
