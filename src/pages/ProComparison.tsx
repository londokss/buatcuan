import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, PlayCircle, Share2, Sparkles, Video, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const freeItems = [
  "4 alat bantu gratis dengan batas harian",
  "Modul awal untuk mulai praktek",
  "Akses komunitas dasar",
  "Komisi 10% per member PRO",
];

const proItems = [
  "Semua 24 alat bantu tanpa batas utama",
  "31 modul penuh + strategi cuan",
  "Bahan video & foto terus diperbarui",
  "Musik, caption, hook, script closing terbaru",
  "Bimbingan mentor + AI + tim BuatCuan",
  "Komisi 50% berulang tiap perpanjangan",
];

const testimonials = [
  { name: "Rizky Amelia", text: "Awalnya cuma ikut modul awal. Setelah PRO, tools hook dan bahan video bikin upload jadi lebih konsisten." },
  { name: "Ibu Sari", text: "Dapat komisi pertama karena tinggal pakai script promosi dan follow up dari mentor." },
];

const ProComparison = () => {
  const shareUrl = `${window.location.origin}/app/pro-comparison`;

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link perbandingan PRO disalin");
  };

  return (
    <div className="space-y-5 pb-3">
      <section className="rounded-[28px] border border-yellow-500/45 bg-yellow-500/10 p-5">
        <span className="inline-flex rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-black text-yellow-300">Bisa dibagikan mentor</span>
        <h1 className="mt-4 text-3xl font-black leading-tight">Kenapa Banyak Member Naik ke PRO?</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
          PRO bukan cuma buka fitur. PRO bikin member punya sistem harian: belajar, ambil bahan konten, pakai tools, dibimbing, lalu promosi lebih terarah.
        </p>
        <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-yellow-500/15 text-yellow-300">
              <PlayCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black">Video demo 2-3 menit</p>
              <p className="text-xs font-semibold text-muted-foreground">Lihat apa yang terbuka saat jadi PRO</p>
            </div>
            <span className="text-xs font-black text-yellow-300">3 mnt</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <PlanCard title="FREE" price="Rp0" items={freeItems} muted />
        <PlanCard title="PRO" price="Akses penuh" items={proItems} />
      </section>

      <section className="rounded-3xl border border-primary/35 bg-primary/10 p-5">
        <h2 className="font-black text-primary">Yang terus diperbarui tim BuatCuan</h2>
        <div className="mt-4 grid gap-3">
          <UpdateRow icon={Video} title="Bahan konten" desc="Video footage dan foto AI quality tinggi ditambah rutin." />
          <UpdateRow icon={Sparkles} title="Tools viral" desc="Hook, caption, tagar, musik, script, dan ide konten mengikuti tren terbaru." />
          <UpdateRow icon={Crown} title="Materi belajar" desc="Update strategi sosial media, algoritma, dan cara pakai fitur baru." />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-black">Bukti Member Mulai Jalan</h2>
        {testimonials.map((item) => (
          <div key={item.name} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-black">{item.name}</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">"{item.text}"</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border bg-card p-4">
        <Button onClick={copyShare} className="h-12 w-full rounded-2xl font-black">
          <Share2 className="mr-2 h-4 w-4" />
          Salin Link Penjelasan PRO
        </Button>
        <Link to="/app/payment" className="mt-3 flex h-12 items-center justify-center rounded-2xl border border-yellow-500/40 bg-yellow-500/10 font-black text-yellow-300">
          Daftar PRO Sekarang <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
};

function PlanCard({ title, price, items, muted = false }: { title: string; price: string; items: string[]; muted?: boolean }) {
  return (
    <section className={`rounded-3xl border p-4 ${muted ? "border-border bg-card" : "border-yellow-500/45 bg-yellow-500/10"}`}>
      <p className={`text-xs font-black ${muted ? "text-muted-foreground" : "text-yellow-300"}`}>{title}</p>
      <p className="mt-1 text-xl font-black">{price}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-xs font-semibold leading-relaxed">
            {muted ? <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpdateRow({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card/70 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted-foreground">{desc}</span>
      </span>
    </div>
  );
}

export default ProComparison;
