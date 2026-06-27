import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { faqCategories, faqItems, legalConfig } from "@/data/legal";
import { useSeo } from "@/hooks/useSeo";
import { LegalShell, RelatedLinks } from "@/pages/LegalDocument";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<(typeof faqCategories)[number]>("General");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return faqItems.filter((item) => {
      const matchCategory = item.category === category;
      const matchQuery = !query || `${item.question} ${item.answer}`.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });
  }, [category, q]);

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }), []);

  useSeo({
    title: "FAQ",
    description: `Pertanyaan umum tentang akun, billing, privacy, refund, teknis, cookies, AI-generated content, dan subscription ${legalConfig.companyName}.`,
    path: "/faq",
    structuredData,
  });

  return (
    <LegalShell>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
        <BackButton to="/" />
        <header className="mt-5 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black leading-tight md:text-5xl">FAQ Page</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Temukan jawaban tentang akun, billing, privacy, teknis, refund, cookies, penghapusan data, dan batas tanggung jawab platform.
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">Last updated: {legalConfig.effectiveDate}</p>
        </header>

        <section className="mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Cari pertanyaan..."
              className="h-12 rounded-2xl bg-secondary pl-10"
              aria-label="Cari FAQ"
            />
          </div>

          <Tabs value={category} onValueChange={(value) => setCategory(value as typeof category)} className="mt-5">
            <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-secondary p-2">
              {faqCategories.map((item) => (
                <TabsTrigger key={item} value={item} className="shrink-0 rounded-xl px-4 py-2 data-[state=active]:bg-background">
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            {faqCategories.map((item) => (
              <TabsContent key={item} value={item} className="mt-5">
                <Accordion type="single" collapsible className="space-y-3">
                  {filtered.map((faq, index) => (
                    <AccordionItem key={faq.question} value={`${faq.category}-${index}`} className="rounded-2xl border border-white/10 bg-card px-4">
                      <AccordionTrigger className="text-left text-base font-extrabold hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-7 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-card p-5 text-sm text-muted-foreground">
                    Tidak ada FAQ yang cocok dengan pencarian.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <RelatedLinks currentPath="/faq" />
      </div>
    </LegalShell>
  );
};

export default FAQ;
