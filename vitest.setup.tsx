import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

type LinkLike = string | URL | { pathname?: string } | undefined;
type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: LinkLike;
};

type ImageLike = string | { src?: string } | undefined;
type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: ImageLike;
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

const resolveSrc = (src: ImageLike): string => {
  if (!src) return "";
  if (typeof src === "string") return src;
  if (typeof src === "object" && "src" in src && src.src) {
    return src.src;
  }
  return "";
};

if (typeof window !== "undefined" && !window.matchMedia) {
  const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();
  window.matchMedia = (query: string): MediaQueryList => {
    const mediaQueryList: MediaQueryList = {
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

    return mediaQueryList;
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
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  }
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, priority, loader, fill, ...rest }: NextImageProps & { priority?: boolean; loader?: unknown; fill?: boolean; }) => {
  const resolvedSrc = resolveSrc(src);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolvedSrc} alt={alt} {...rest} />;
  }
}));

vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  };

  const params: Record<string, unknown> = {};

  const setParams = (next: Record<string, unknown> | null | undefined) => {
    Object.keys(params).forEach((key) => delete params[key]);
    if (next && typeof next === "object") {
      Object.assign(params, next);
    }
  };

  const resetRouter = () => {
    Object.values(router).forEach((value) => {
      if (typeof value === "function" && "mockClear" in value) {
        (value as ReturnType<typeof vi.fn>).mockClear();
      }
    });
  };

  return {
    __esModule: true,
    useRouter: () => router,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    useParams: () => params,
    __setMockParams: setParams,
    __resetMockRouter: resetRouter,
    __getMockRouter: () => router
  };
});
