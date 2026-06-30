import { describe, expect, it } from "vitest";
import { buildAgendaTimeSlots } from "@/components/appointments/AgendaDayView";

describe("AgendaDayView", () => {
  it("should respect active professional working hours when building visible slots", () => {
    const slots = buildAgendaTimeSlots(
      [],
      [
        {
          id: "pro-1",
          name: "Ana",
          workingHours: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
          ],
        } as never,
      ]
    );

    expect(slots[0]).toBe("09:00");
    expect(slots).toContain("17:30");
    expect(slots).not.toContain("08:00");
    expect(slots).not.toContain("18:00");
    expect(slots).not.toContain("19:30");
  });

  it("should keep existing appointments visible even when they fall outside configured hours", () => {
    const slots = buildAgendaTimeSlots(
      [
        {
          id: "apt-1",
          startTime: "08:30",
        } as never,
      ],
      [
        {
          id: "pro-1",
          name: "Ana",
          workingHours: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
          ],
        } as never,
      ]
    );

    expect(slots[0]).toBe("08:30");
    expect(slots).toContain("09:00");
  });
});
