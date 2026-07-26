describe("useOnboardingStore persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("discards a draft saved with the old ServiceDraft/ProfessionalDraft shape instead of crashing", async () => {
    localStorage.setItem(
      "azzo:onboarding:draft",
      JSON.stringify({
        state: {
          currentStep: 3,
          salonData: { name: "Salão Antigo", type: "SALAO_FEMININO", phone: "119999", city: "SP", state: "SP" },
          professionals: [
            { id: "old-1", name: "Maria", role: "CABELEIREIRO", businessHours: [{ day: "SEG", startTime: "09:00", endTime: "18:00" }] },
          ],
          services: [{ id: "old-svc-1", name: "Corte", durationMinutes: 30, price: 50 }],
          assignments: {},
        },
        version: 0,
      })
    );

    const { useOnboardingStore } = await import("@/stores/onboarding");
    const state = useOnboardingStore.getState();

    expect(state.professionals).toEqual([]);
    expect(state.services).toEqual([]);
    expect(state.salonData).toBeNull();
    expect(state.currentStep).toBe(0);
  });

  it("keeps a draft already saved with the current shape", async () => {
    localStorage.setItem(
      "azzo:onboarding:draft",
      JSON.stringify({
        state: {
          currentStep: 2,
          salonData: null,
          professionals: [],
          services: [
            { id: "svc-1", name: "Corte", durationMinutes: 30, price: 50, category: "Cabelo", professionalIds: [] },
          ],
        },
        version: 2,
      })
    );

    const { useOnboardingStore } = await import("@/stores/onboarding");
    const state = useOnboardingStore.getState();

    expect(state.services).toEqual([
      { id: "svc-1", name: "Corte", durationMinutes: 30, price: 50, category: "Cabelo", professionalIds: [] },
    ]);
    expect(state.currentStep).toBe(2);
  });
});
