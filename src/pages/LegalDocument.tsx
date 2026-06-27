import { Link, Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { CalendarDays, FileText } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { legalConfig, legalDocs, relatedLegalLinks, type LegalDoc } from "@/data/legal";
import { useSeo } from "@/hooks/useSeo";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";

const pathToDoc = Object.values(legalDocs).reduce<Record<string, LegalDoc>>((acc, doc) => {
  acc[doc.path] = doc;
  return acc;
}, {});

const LegalDocument = () => {
  const { pathname } = useLocation();
  const doc = pathToDoc[pathname];
  const seoDoc = doc ?? legalDocs.terms;

  useSeo({
    title: seoDoc.title,
    description: seoDoc.description,
    path: seoDoc.path,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: seoDoc.title,
      description: seoDoc.description,
      url: `https://${legalConfig.domainName}${seoDoc.path}`,
      dateModified: seoDoc.lastUpdated,
      publisher: { "@type": "Organization", name: legalConfig.companyName },
    },
  });

  if (!doc) return <Navigate to="/terms" replace />;

  return (
    <LegalShell>
      <article className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Table of contents" className="rounded-2xl border border-white/10 bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Table of Contents</p>
            <div className="mt-3 space-y-1">
              {doc.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="block rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground">
                  {section.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <div className="min-w-0">
          <BackButton to="/" />
          <header className="mt-5 border-b border-white/10 pb-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <FileText className="h-3.5 w-3.5" /> Legal
            </div>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">{doc.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{doc.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2">
                <CalendarDays className="h-3.5 w-3.5" /> Last updated: {doc.lastUpdated}
              </span>
              <span className="rounded-full bg-secondary px-3 py-2">Effective date: {legalConfig.effectiveDate}</span>
            </div>
          </header>

          <div className="mt-8 space-y-10">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-2xl font-extrabold">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <RelatedLinks currentPath={doc.path} />
        </div>
      </article>
    </LegalShell>
  );
};

export const LegalShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="fixed inset-0 bg-gradient-hero pointer-events-none" />
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo/buatcuan-icon.png" alt="BuatCuan" className="h-9 w-9 rounded-xl object-contain" />
          <span className="font-extrabold">Buat<span className="text-gradient-primary">Cuan</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/faq" className="hidden rounded-2xl px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex">
            FAQ
          </Link>
          <ThemeModeToggle />
        </div>
      </div>
    </header>
    <main className="relative">{children}</main>
  </div>
);

export const RelatedLinks = ({ currentPath }: { currentPath?: string }) => (
  <section className="mt-12 rounded-2xl border border-white/10 bg-card p-5">
    <h2 className="text-xl font-extrabold">Link Terkait</h2>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {relatedLegalLinks.filter((link) => link.path !== currentPath).map((link) => (
        <Link key={link.path} to={link.path} className="rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          {link.label}
        </Link>
      ))}
    </div>
  </section>
);

export default LegalDocument;
