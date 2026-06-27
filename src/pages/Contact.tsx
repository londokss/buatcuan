import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { legalConfig } from "@/data/legal";
import { useSeo } from "@/hooks/useSeo";
import { LegalShell, RelatedLinks } from "@/pages/LegalDocument";

const Contact = () => {
  useSeo({
    title: "Contact",
    description: `Hubungi ${legalConfig.companyName} untuk support akun, billing, privacy request, legal notice, dan laporan penyalahgunaan.`,
    path: "/contact",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: `Contact ${legalConfig.companyName}`,
      url: `https://${legalConfig.domainName}/contact`,
      publisher: { "@type": "Organization", name: legalConfig.companyName, email: legalConfig.companyEmail },
    },
  });

  return (
    <LegalShell>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
        <BackButton to="/" />
        <header className="mt-5 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-black leading-tight md:text-5xl">Contact Page</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Gunakan kanal berikut untuk support, legal notice, privacy request, refund request, atau laporan penyalahgunaan platform.
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">Last updated: {legalConfig.effectiveDate}</p>
        </header>

        <p className="mt-2 text-sm font-bold text-muted-foreground">{legalConfig.legalEntityName}</p>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <ContactBlock icon={Mail} title="Support Email" value={legalConfig.supportEmail} href={`mailto:${legalConfig.supportEmail}`} />
          <ContactBlock icon={MessageCircle} title="Legal Email" value={legalConfig.companyEmail} href={`mailto:${legalConfig.companyEmail}`} />
          <ContactBlock
            icon={Phone}
            title="WhatsApp CS"
            value={legalConfig.supportWhatsApp}
            href={legalConfig.supportWhatsApp.startsWith("[") ? undefined : `https://wa.me/${legalConfig.supportWhatsApp}`}
          />
          <ContactBlock icon={MapPin} title="Company Address" value={legalConfig.companyAddress} />
        </section>

        <section id="support-scope" className="mt-10 scroll-mt-24">
          <h2 className="text-2xl font-extrabold">Jenis Permintaan</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Account Support", "Masalah login, keamanan akun, perubahan data, atau akses membership."],
              ["Billing Support", "Konfirmasi pembayaran, invoice, pending payment, refund, atau dispute transaksi."],
              ["Privacy Request", "Permintaan akses data, koreksi, penghapusan data, atau pembatasan pemrosesan."],
              ["Abuse Report", "Laporan spam, fraud, pelanggaran hak cipta, atau penyalahgunaan tools."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-card p-4">
                <h2 className="text-lg font-extrabold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="response-time" className="mt-10 scroll-mt-24">
          <h2 className="text-2xl font-extrabold">Estimasi Respons</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Kami berupaya merespons pesan support dalam 1-3 hari kerja. Permintaan terkait keamanan, pembayaran bermasalah, atau penghapusan data dapat membutuhkan verifikasi tambahan sebelum diproses.
          </p>
        </section>

        <RelatedLinks currentPath="/contact" />
      </div>
    </LegalShell>
  );
};

const ContactBlock = ({ icon: Icon, title, value, href }: { icon: typeof Mail; title: string; value: string; href?: string }) => {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-primary/25">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
      <p className="mt-2 break-words text-sm font-semibold text-muted-foreground">{value}</p>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
};

export default Contact;
