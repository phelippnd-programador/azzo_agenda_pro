import { buildPublicBookingUrl } from "@/lib/public-booking-url";

describe("public-booking-url", () => {
  it("should not duplicate agendar path when absolute url already contains slug", () => {
    expect(buildPublicBookingUrl("mister", "http://localhost:5173/agendar/mister")).toBe(
      "http://localhost:5173/agendar/mister"
    );
  });

  it("should rebuild url with current slug when database returns another slug", () => {
    expect(buildPublicBookingUrl("novo-salao", "http://localhost:5173/agendar/mister")).toBe(
      "http://localhost:5173/agendar/novo-salao"
    );
  });

  it("should append agendar path when only origin is provided", () => {
    expect(buildPublicBookingUrl("mister", "http://localhost:5173")).toBe(
      "http://localhost:5173/agendar/mister"
    );
  });

  it("should preserve application base path before agendar", () => {
    expect(buildPublicBookingUrl("mister", "https://qa.local/app/agendar/antigo")).toBe(
      "https://qa.local/app/agendar/mister"
    );
  });
});
