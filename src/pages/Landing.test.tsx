import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Landing from "./Landing";

const landingMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: { landing: (...args: unknown[]) => landingMock(...args) },
  assetUrl: (url?: string | null) => (url ? `https://cdn.test${url}` : ""),
}));

vi.mock("@/context/AppContext", async () => {
  const actual = await vi.importActual<typeof import("@/context/AppContext")>("@/context/AppContext");
  return {
    ...actual,
    useApp: () => ({ user: null, loading: false }),
  };
});

function renderLanding() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Verbatim from the compliance briefing's "Yang JANGAN dipajang" blacklist.
const overclaimBlacklist = [
  "pasti cuan",
  "pasti viral",
  "pasti fyp",
  "dijamin berhasil",
  "cepat kaya",
  "langsung kaya",
  "balik modal pasti",
  "passive income otomatis",
  "100% aman",
  "saldo masuk tiap hari",
  "komisi pasti cair",
  "langsung cuan",
];

// The 4 removed badges' exact labels (their "Rp0" value collides with the legitimate FREE plan
// price elsewhere on the page, so the labels — unique combinations of words — are checked instead).
const fabricatedHeroStatLabels = ["member belajar", "komisi PRO", "AI support", "mulai gratis"];
const fabricatedTestimonialNames = ["Ibu Sari", "Dewi Kartika", "Rizky Amelia"];

describe("Landing page compliance", () => {
  beforeEach(() => {
    landingMock.mockReset();
    // Empty object, not undefined — React Query warns/rejects when a query fn resolves to
    // undefined. normalizeLandingContent treats a missing field the same way either way.
    landingMock.mockResolvedValue({});
  });

  it("does not render the fabricated testimonial section by default", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    expect(screen.queryByText(/Bukti Member/i)).not.toBeInTheDocument();
    for (const name of fabricatedTestimonialNames) {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Rp1,2jt komisi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/8\.200 followers/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/12 member aktif/i)).not.toBeInTheDocument();
  });

  it("does not render any of the four fabricated hero stat badges", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    // Exact whole-text match (not substring/regex) — "komisi PRO"/"AI support" etc. as bare
    // *substrings* legitimately still appear inside longer, compliant sentences elsewhere on the
    // page (e.g. the calculator subtitle), so a substring/regex check here would false-positive.
    for (const label of fabricatedHeroStatLabels) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("closing CTA reads 'Mulai GRATIS Sekarang'", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    expect(screen.getAllByText("Mulai GRATIS Sekarang").length).toBeGreaterThan(0);
    expect(screen.queryByText("Mulai PRO Sekarang")).not.toBeInTheDocument();
  });

  it("footer has the results disclaimer, 4 legal links + FAQ, and a contact/complaint block", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    const footer = within(screen.getByRole("contentinfo"));

    expect(
      footer.getByText(/Hasil tiap orang berbeda tergantung praktik & konsistensi\. Bukan janji hasil instan\. Komisi berpotensi, bukan dijamin\./i),
    ).toBeInTheDocument();

    expect(footer.getByRole("link", { name: "Syarat & Ketentuan" })).toHaveAttribute("href", "/terms");
    expect(footer.getByRole("link", { name: "Kebijakan Privasi" })).toHaveAttribute("href", "/privacy");
    expect(footer.getByRole("link", { name: "Kebijakan Refund" })).toHaveAttribute("href", "/refund-policy");
    expect(footer.getByRole("link", { name: "Aturan Affiliate/Komisi" })).toHaveAttribute("href", "/affiliate-rules");
    expect(footer.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/faq");

    expect(footer.getByText(/Kontak & Pengaduan Konsumen/i)).toBeInTheDocument();
    expect(footer.getAllByText(/PT AKADEMI BUATCUAN INDONESIA/i).length).toBeGreaterThan(0);
  });

  it("calculator shows the result disclaimer and the commission-link disclosure", async () => {
    renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    expect(screen.getByText(/Contoh hitungan, bukan janji/i)).toBeInTheDocument();
    expect(screen.getAllByText(/komisi berpotensi, bukan dijamin/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Link referral yang kamu bagikan adalah link komisi/i)).toBeInTheDocument();
    expect(screen.getByText(/bukan dari merekrut mentor\/affiliate baru/i)).toBeInTheDocument();
  });

  it("hero headline contains BUATCUAN and falls back to a static gradient (no video configured)", async () => {
    renderLanding();
    const heading = await screen.findByRole("heading", { level: 1 });

    expect(heading.textContent).toContain("BUATCUAN");
    expect(screen.queryByTestId("hero-bg-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-bg-fallback-gradient")).toBeInTheDocument();
  });

  it("contains none of the blacklisted overclaim phrases anywhere on the page", async () => {
    const { container } = renderLanding();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument());

    const text = container.textContent?.toLowerCase() ?? "";
    for (const phrase of overclaimBlacklist) {
      expect(text).not.toContain(phrase);
    }
  });
});
