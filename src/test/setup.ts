import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  // @ts-expect-error test polyfill
  globalThis.ResizeObserver = ResizeObserverMock;
}

if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = (() => "blob:test") as typeof URL.createObjectURL;
}

if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL;
}
