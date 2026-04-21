type MarketingEventPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackMarketingEvent(eventName: string, payload: MarketingEventPayload = {}) {
  if (typeof window === "undefined") return;

  const eventPayload = {
    event: eventName,
    ...payload,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(eventPayload);
  }

  window.dispatchEvent(
    new CustomEvent("azzo:marketing-event", {
      detail: eventPayload,
    })
  );
}
