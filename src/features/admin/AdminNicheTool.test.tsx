import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminNicheTool } from "./AdminNicheTool";
import type { NicheCandidateAdminDto, NicheScoringConfigAdminDto } from "@/lib/api";

const listMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const removeMock = vi.fn();
const getScoringConfigMock = vi.fn();
const updateScoringConfigMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    admin: {
      niche: {
        candidates: {
          list: (...args: unknown[]) => listMock(...args),
          create: (...args: unknown[]) => createMock(...args),
          update: (...args: unknown[]) => updateMock(...args),
          remove: (...args: unknown[]) => removeMock(...args),
        },
        scoringConfig: {
          get: (...args: unknown[]) => getScoringConfigMock(...args),
          update: (...args: unknown[]) => updateScoringConfigMock(...args),
        },
      },
    },
  },
  getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const DEFAULT_CANDIDATE: NicheCandidateAdminDto = {
  id: "cand-default",
  slug: "affiliate-buatcuan",
  name: "Affiliate BuatCuan",
  jalurCuan: "AFFILIATE_BUATCUAN",
  isDefault: true,
  pilarNiche: "Affiliate BuatCuan (single-level, NO MLM)",
  peminat: 5,
  ongkosBalik: 5,
  saingan: 1,
  kepercayaan: 5,
  tren2026: "NAIK",
  modal: "RINGAN",
  bebanWaktu: "RINGAN",
  tampilMuka: "OPSIONAL",
  isSensitive: false,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SKINCARE_CANDIDATE: NicheCandidateAdminDto = {
  ...DEFAULT_CANDIDATE,
  id: "cand-skincare",
  slug: "skincare",
  name: "Skincare",
  jalurCuan: "TIKTOK_AFFILIATE",
  isDefault: false,
  sortOrder: 1,
};

function defaultScoringConfig(): NicheScoringConfigAdminDto {
  return {
    config: {
      base: {
        peminat: { max: 15, tiers: [{ min: 1, max: 2, points: 5 }, { min: 3, max: 3, points: 10 }, { min: 4, max: 5, points: 15 }] },
        ongkosBalik: { max: 15, tiers: [{ min: 1, max: 2, points: 5 }, { min: 3, max: 3, points: 10 }, { min: 4, max: 5, points: 15 }] },
        kepercayaan: { max: 10, tiers: [{ min: 1, max: 2, points: 3 }, { min: 3, max: 3, points: 6 }, { min: 4, max: 5, points: 10 }] },
        saingan: { max: 10, tiers: [{ min: 1, max: 2, points: 10 }, { min: 3, max: 3, points: 6 }, { min: 4, max: 5, points: 3 }] },
        tren2026: { max: 5, points: { MUSIMAN: 1, STABIL: 3, NAIK: 5 } },
      },
      personal: {
        cinta: { max: 20, points: { KURANG: 7, LUMAYAN: 13, BANGET: 20 } },
        okeDikuasai: { max: 15, points: { BELUM: 5, LUMAYAN: 10, UDAH: 15 } },
        modalWaktu: { max: 10, points: { BERAT: 3, SEDANG: 6, RINGAN: 10 } },
      },
      thresholds: { utama: 80, layak: 60, cadangan: 40 },
      fallbackBelow: 40,
      filters: {
        waktuMismatch: { userLevel: "RINGAN", candidateBebanWaktu: "BERAT" },
        aksesBarangRequiredJalur: ["TIKTOK_AFFILIATE", "GABUNGAN"],
        minatBoostEnabled: true,
      },
    },
    isOverridden: false,
    updatedAt: null,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminNicheTool />
    </QueryClientProvider>,
  );
}

describe("AdminNicheTool", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue([DEFAULT_CANDIDATE, SKINCARE_CANDIDATE]);
    createMock.mockReset();
    updateMock.mockReset();
    removeMock.mockReset();
    getScoringConfigMock.mockReset().mockResolvedValue(defaultScoringConfig());
    updateScoringConfigMock.mockReset();
  });

  it("disables the delete button for the default Affiliate BuatCuan row", async () => {
    renderPage();
    await screen.findByText("Affiliate BuatCuan");

    const rows = screen.getAllByRole("row");
    const defaultRow = rows.find((row) => within(row).queryByText("Affiliate BuatCuan"));
    expect(defaultRow).toBeDefined();
    const deleteButton = within(defaultRow!).getByTitle("Affiliate BuatCuan tidak bisa dihapus");
    expect(deleteButton).toBeDisabled();
  });

  it("shows the default candidate as locked (isActive/isSensitive switches disabled) in the edit dialog", async () => {
    renderPage();
    await screen.findByText("Affiliate BuatCuan");

    const rows = screen.getAllByRole("row");
    const defaultRow = rows.find((row) => within(row).queryByText("Affiliate BuatCuan"));
    fireEvent.click(within(defaultRow!).getByTitle("Edit niche"));

    await screen.findByText(/Affiliate BuatCuan terkunci sistem/i);
    const switches = screen.getAllByRole("switch");
    expect(switches.every((el) => el.hasAttribute("disabled"))).toBe(true);
  });

  it("rejects an invalid slug without calling the create API", async () => {
    renderPage();
    await screen.findByText("Affiliate BuatCuan");

    fireEvent.click(screen.getByText("Tambah Niche"));

    const nameInput = await screen.findByLabelText("Nama");
    fireEvent.change(nameInput, { target: { value: "Niche Baru" } });
    const slugInput = screen.getByLabelText("Slug");
    fireEvent.change(slugInput, { target: { value: "Slug Tidak Valid!!" } });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(createMock).not.toHaveBeenCalled());
  });

  it("creates a candidate when the form is valid", async () => {
    createMock.mockResolvedValue(SKINCARE_CANDIDATE);
    renderPage();
    await screen.findByText("Affiliate BuatCuan");

    fireEvent.click(screen.getByText("Tambah Niche"));
    fireEvent.change(await screen.findByLabelText("Nama"), { target: { value: "Niche Baru" } });
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "niche-baru" } });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toMatchObject({ slug: "niche-baru", name: "Niche Baru" });
  });

  it("flags the scoring config total and disables save when the base (A) weights don't sum to 55", async () => {
    renderPage();
    const baseTotalLabel = await screen.findByText(/Total Skor Dasar Niche \(A\)/i);
    const baseCard = baseTotalLabel.closest("div");
    expect(within(baseCard!).getByText("55")).toBeInTheDocument();

    const saveConfigButton = screen.getByRole("button", { name: "Simpan Konfigurasi Skor" });
    expect(saveConfigButton).not.toBeDisabled();

    const peminatMaxInput = screen.getAllByDisplayValue("15")[0]!;
    fireEvent.change(peminatMaxInput, { target: { value: "20" } });

    await waitFor(() => expect(within(baseCard!).getByText("60")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Simpan Konfigurasi Skor" })).toBeDisabled();
  });

  it("lets admin toggle the waktu/aksesBarang/minat filter rules and saves them", async () => {
    updateScoringConfigMock.mockResolvedValue(defaultScoringConfig().config);
    renderPage();
    await screen.findByText("Filter Profil (Saringan Aman)");

    // Toggle off "Gabungan" from the jalur that require product access.
    fireEvent.click(screen.getByRole("button", { name: "🔗 Gabungan" }));
    // Turn off the minat soft-boost (only switch visible while the candidate dialog is closed).
    fireEvent.click(screen.getByRole("switch"));

    fireEvent.click(screen.getByRole("button", { name: "Simpan Konfigurasi Skor" }));

    await waitFor(() => expect(updateScoringConfigMock).toHaveBeenCalledTimes(1));
    const saved = updateScoringConfigMock.mock.calls[0][0];
    expect(saved.filters.aksesBarangRequiredJalur).toEqual(["TIKTOK_AFFILIATE"]);
    expect(saved.filters.minatBoostEnabled).toBe(false);
  });
});
