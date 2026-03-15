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
