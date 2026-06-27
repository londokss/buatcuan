import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NicheToolFlow } from "./NicheToolFlow";
import type { NicheCandidateV1Dto, NicheResultResponseV1Dto, NicheScoreResponseV1Dto } from "@/lib/api";

const candidatesMock = vi.fn();
const scoreMock = vi.fn();
const saveResultMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    nicheV1: {
      candidates: (...args: unknown[]) => candidatesMock(...args),
      score: (...args: unknown[]) => scoreMock(...args),
      saveResult: (...args: unknown[]) => saveResultMock(...args),
    },
  },
  getErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const SKINCARE: NicheCandidateV1Dto = {
  id: "cand-skincare",
  slug: "skincare",
  name: "Skincare",
  jalurCuan: "TIKTOK_AFFILIATE",
  isDefault: false,
  pilarNiche: "Kecantikan & Perawatan Kulit",
  tren2026: "NAIK",
  modal: "SEDANG",
  bebanWaktu: "SEDANG",
  tampilMuka: "OPSIONAL",
  isFlaggedSensitive: false,
};

const DEFAULT_CANDIDATE: NicheCandidateV1Dto = {
  id: "cand-default",
  slug: "affiliate-buatcuan",
  name: "Affiliate BuatCuan",
  jalurCuan: "AFFILIATE_BUATCUAN",
  isDefault: true,
  pilarNiche: "Affiliate BuatCuan (single-level, NO MLM)",
  tren2026: "NAIK",
  modal: "RINGAN",
  bebanWaktu: "RINGAN",
  tampilMuka: "OPSIONAL",
  isFlaggedSensitive: false,
};

function makeScoreResponse(): NicheScoreResponseV1Dto {
  const entry = {
    rank: 1,
    isPrimary: true,
    candidateId: SKINCARE.id,
    candidateName: SKINCARE.name,
    jalurCuan: SKINCARE.jalurCuan,
    isDefault: false,
    baseScore: 48,
    personalScore: 36,
    finalScore: 84,
    lamp: "UTAMA" as const,
    isFlaggedSensitive: false,
  };
  return { ranked: [entry], primary: entry, fallbackApplied: false };
}

function renderFlow() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NicheToolFlow />
    </QueryClientProvider>,
  );
}

describe("NicheToolFlow", () => {
  beforeEach(() => {
    candidatesMock.mockReset();
    scoreMock.mockReset();
    saveResultMock.mockReset();
    candidatesMock.mockResolvedValue([DEFAULT_CANDIDATE, SKINCARE]);
    scoreMock.mockResolvedValue(makeScoreResponse());
  });

  it("Layar 1: Affiliate BuatCuan sudah ke-pilih duluan secara default", () => {
    renderFlow();
    const defaultOption = screen.getByTestId("niche-jalur-option-AFFILIATE_BUATCUAN");
    expect(defaultOption.className).toContain("border-primary");
  });

  it("Layar 2: tombol Lanjut terkunci sampai 3 pertanyaan wajib terisi, opsional boleh di-skip", () => {
    renderFlow();
    fireEvent.click(screen.getByTestId("niche-jalur-next"));

    expect(screen.getByTestId("niche-profil-next")).toBeDisabled();

    fireEvent.click(screen.getByTestId("niche-profil-modal-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-waktu-SEDANG"));
    expect(screen.getByTestId("niche-profil-next")).toBeDisabled();

    fireEvent.click(screen.getByTestId("niche-profil-tampil-muka-OPSIONAL"));
    expect(screen.getByTestId("niche-profil-next")).not.toBeDisabled();
  });

  it("Layar 2->3: skip opsional (minat/aksesBarang) tidak mengirim field itu ke /candidates, tapi waktu wajib tetap terkirim", async () => {
    renderFlow();
    fireEvent.click(screen.getByTestId("niche-jalur-next"));

    fireEvent.click(screen.getByTestId("niche-profil-modal-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-waktu-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-tampil-muka-OPSIONAL"));
    fireEvent.click(screen.getByTestId("niche-profil-next"));

    await screen.findByTestId("niche-kandidat-list");
    expect(candidatesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ waktu: "SEDANG", aksesBarang: undefined, minat: undefined }),
    );
  });

  it("Layar 2->3: minat dan aksesBarang yang diisi ikut terkirim ke /candidates", async () => {
    renderFlow();
    fireEvent.click(screen.getByTestId("niche-jalur-next"));

    fireEvent.click(screen.getByTestId("niche-profil-modal-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-waktu-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-tampil-muka-OPSIONAL"));
    fireEvent.change(screen.getByTestId("niche-profil-minat"), { target: { value: "skincare" } });
    fireEvent.click(screen.getByTestId("niche-profil-akses-barang"));
    fireEvent.click(screen.getByTestId("niche-profil-next"));

    await screen.findByTestId("niche-kandidat-list");
    expect(candidatesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ waktu: "SEDANG", aksesBarang: true, minat: "skincare" }),
    );
  });

  it("alur lengkap: pilih jalur -> profil -> centang kandidat -> saringan -> skor -> simpan hasil", async () => {
    saveResultMock.mockResolvedValue({
      id: "result-1",
      primaryNicheId: SKINCARE.id,
      primaryNicheName: SKINCARE.name,
      primaryScore: 84,
      primaryLamp: "UTAMA",
      fallbackApplied: false,
      ranked: makeScoreResponse().ranked,
      primary: makeScoreResponse().primary,
      createdAt: new Date().toISOString(),
    } satisfies NicheResultResponseV1Dto);

    renderFlow();

    // Layar 1: default Affiliate BuatCuan sudah terpilih, langsung lanjut.
    fireEvent.click(screen.getByTestId("niche-jalur-next"));

    // Layar 2: 3 wajib.
    fireEvent.click(screen.getByTestId("niche-profil-modal-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-waktu-SEDANG"));
    fireEvent.click(screen.getByTestId("niche-profil-tampil-muka-OPSIONAL"));
    fireEvent.click(screen.getByTestId("niche-profil-next"));

    // Layar 3: centang 1 kandidat (Skincare).
    await screen.findByTestId("niche-kandidat-list");
    fireEvent.click(screen.getByTestId("niche-candidate-skincare"));
    fireEvent.click(screen.getByTestId("niche-kandidat-next"));

    // Layar 4: Saringan Aman tidak butuh tap wajib — pakai tombol lanjut manual.
    await screen.findByTestId("niche-saringan-screen");
    fireEvent.click(screen.getByTestId("niche-saringan-next"));

    // Layar 5: 3 tap personal, skor live preview muncul.
    await screen.findByTestId("niche-skor-card-skincare");
    fireEvent.click(screen.getByTestId("niche-skor-skincare-cinta-BANGET"));
    fireEvent.click(screen.getByTestId("niche-skor-skincare-oke-dikuasai-UDAH"));
    fireEvent.click(screen.getByTestId("niche-skor-skincare-modal-waktu-RINGAN"));
    await screen.findByTestId("niche-skor-lamp-skincare");
    fireEvent.click(screen.getByTestId("niche-skor-next"));

    // Layar 6: disclaimer baku wajib tampil, lalu simpan.
    await screen.findByTestId("niche-hasil-preview");
    expect(screen.getByTestId("niche-hasil-disclaimer").textContent).toContain(
      "Bukan janji hasil instan. Hasil tiap orang beda tergantung praktik, konsistensi, kualitas konten, dan respons audiens.",
    );
    fireEvent.click(screen.getByTestId("niche-hasil-save"));

    await waitFor(() => expect(saveResultMock).toHaveBeenCalledTimes(1));
    await screen.findByTestId("niche-hasil-saved");
    expect(screen.getByText("Skincare")).toBeInTheDocument();

    // waktu (wajib) is always sent; minat/aksesBarang were skipped here, so /score and /result
    // must build the identical profil shape (undefined, not omitted/cosmetic).
    expect(scoreMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ profil: expect.objectContaining({ waktu: "SEDANG", aksesBarang: undefined, minat: undefined }) }),
    );
    expect(saveResultMock).toHaveBeenLastCalledWith(scoreMock.mock.calls[scoreMock.mock.calls.length - 1][0]);
  });
});
